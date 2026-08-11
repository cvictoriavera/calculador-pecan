# Análisis de API REST y solicitudes del frontend

Fecha de revisión: 21 de julio de 2026.

## Alcance

Este documento cubre las rutas activas bajo el namespace `ccp/v1`, sus capas de controlador y persistencia, y el patrón de solicitudes que genera la SPA React.

Quedan expresamente fuera de alcance porque pertenecen a versiones anteriores y no están en uso:

- `annual-records`;
- exportación e importación de proyectos;
- el contenido del README.

## Resumen ejecutivo

La API cuenta con endpoints batch útiles para costos, inversiones y producción, y la mayoría de consultas SQL parametrizan correctamente sus valores. Los riesgos principales no están en inyección SQL, sino en la consistencia de relaciones, en mutaciones compuestas que no son atómicas y en cargas frontend repetidas.

Prioridades:

1. Validar siempre la cadena `proyecto -> campaña -> monte` en cada mutación.
2. Unificar las operaciones compuestas de producción en un único comando transaccional.
3. Eliminar duplicaciones de carga al iniciar y cambiar de proyecto.
4. Sustituir lotes simulados del cliente por endpoints batch reales para mutaciones.
5. Centralizar caché, deduplicación e invalidación de requests.

## Rutas activas revisadas

| Dominio | Rutas principales |
| --- | --- |
| Proyectos | `GET/POST /ccp/v1/projects`, `GET/PUT/DELETE /ccp/v1/projects/{id}` |
| Campañas | `GET /campaigns/by-project/{project_id}`, `POST /campaigns`, `PUT /campaigns/{id}`, `POST /campaigns/close-active` |
| Montes | `GET /montes/by-project/{project_id}`, `POST /montes`, `PUT/DELETE /montes/{id}` |
| Producción | `GET/POST/DELETE /productions/by-campaign/{campaign_id}`, `POST /productions/by-campaigns/batch` |
| Costos | `GET /costs/{project_id}/{campaign_id}`, `GET /costs/batch`, `POST /costs`, `PUT/DELETE /costs/{cost_id}` |
| Inversiones | `GET /investments/{project_id}`, `GET /investments/{project_id}/{campaign_id}`, `GET /investments/batch`, `POST /investments`, `PUT/DELETE /investments/{investment_id}` |
| Modelos de rendimiento | `GET /yield-models/by-project/{project_id}`, `POST /yield-models`, `PUT/DELETE /yield-models/{id}` |
| Usuario | `GET /users/me` |
| Administración | Rutas `database/*`, restringidas a `manage_options` |

## Hallazgos de API y arquitectura

### 1. Crítico: no se comprueba la coherencia entre proyecto, campaña y monte

Las operaciones de producción, costos e inversiones validan que el usuario sea dueño del proyecto. Sin embargo, no verifican que la campaña recibida pertenezca a ese proyecto; en producción tampoco se comprueba que cada `monte_id` pertenezca al mismo proyecto.

Las claves foráneas simples verifican que un ID exista, pero no garantizan que `project_id`, `campaign_id` y `monte_id` pertenezcan al mismo agregado. Por ejemplo, un usuario con dos proyectos puede asociar una campaña del proyecto A con datos del proyecto B.

En producción el problema es especialmente grave: `update_batch()` elimina por `campaign_id` y luego inserta validando sólo el proyecto. Esto puede borrar producción de una campaña y reinsertarla cruzada con otro proyecto.

Impacto:

- corrupción de reportes y totales;
- registros imposibles de interpretar o depurar;
- potencial exposición del nombre de un monte si se referencia un ID ajeno conocido;
- fallas de claves foráneas en instalaciones que las tengan aplicadas.

Acción recomendada:

- crear un servicio/consulta de autorización único que compruebe `campaign.id AND campaign.project_id AND project.user_id`;
- comprobar cada monte mediante `monte.id AND monte.project_id`;
- realizar esa validación antes de borrar o insertar;
- aplicar la misma regla en todas las rutas batch y en la capa DB.

### 2. Alto: guardado de producción dividido en dos requests independientes

El frontend guarda las filas de producción con `POST /productions/by-campaign/{id}` y actualiza el precio/promedio y total de la campaña con `PUT /campaigns/{id}`. Ambas solicitudes se disparan en paralelo.

Si una tiene éxito y la otra falla, la producción y los totales de campaña quedan desincronizados. En la página de campañas, además, ambas operaciones se ejecutan sin `await`: la interfaz confirma éxito sin saber si el servidor persistió los cambios.

Acción recomendada:

- exponer un comando único, por ejemplo `PUT /campaigns/{id}/production`, que reciba producción y campos resumidos;
- validar relaciones y persistir todo dentro de una transacción;
- devolver la campaña y las filas finales para actualizar el estado local.

### 3. Alto: autorización repartida e interpretación incorrecta de errores

Muchos `permission_callback` sólo comprueban que exista una sesión. La pertenencia se verifica más tarde en la capa DB. Cuando la capa DB devuelve `false`, varios controladores lo convierten en un `500` aunque se trate de un recurso ajeno o inexistente.

Consecuencias:

- el cliente no puede distinguir una falta de permiso de un error interno;
- métricas y logs de servidor registran falsos errores 500;
- la lógica de propiedad queda repetida e inconsistente.

Acción recomendada:

- mover la comprobación de propiedad al `permission_callback` cuando el ID está en la ruta;
- devolver `403` para acceso no autorizado y `404` cuando se desea no revelar la existencia;
- conservar la comprobación en DB como defensa en profundidad, sin traducirla a 500.

### 4. Medio: contratos de entrada y salida heterogéneos

Los controladores no siguen un esquema uniforme de DTOs. Hay validaciones manuales, tipos implícitos y respuestas de mutación diferentes entre recursos. Por ejemplo, costos devuelve sólo `success` e `id` en creación, mientras el frontend necesita consultar otra vez la campaña para obtener el registro completo.

Esto aumenta las solicitudes y obliga a que páginas y stores conozcan detalles del backend.

Acción recomendada:

- definir esquemas de request y response por recurso;
- devolver el recurso creado/actualizado, con el mismo formato que en GET;
- mantener errores normalizados (`code`, `message`, `status`, `details`);
- validar rangos, fechas y enumeraciones antes de llegar a la base de datos.

### 5. Medio: operaciones masivas implementadas como `Promise.all` de requests individuales

Los helpers `createCostBatch` y `updateCostBatch` no son lotes HTTP: realizan una request por elemento. Esto no aporta atomicidad ni reduce conexiones. La creación histórica de campañas sigue el mismo patrón.

Acción recomendada:

- implementar `POST /costs/batch`, `PUT /costs/batch`, `DELETE /costs/batch` y `POST /campaigns/batch`;
- procesar cada lote con una transacción y devolver resultados por ítem;
- como transición, limitar la concurrencia del cliente a 3–5 operaciones.

### 6. Aspectos positivos observados

- Las consultas revisadas usan `wpdb->prepare()` para los valores externos.
- Las lecturas batch de costos, inversiones y producción evitan el patrón N+1 en el servidor.
- La autenticación desde el frontend incorpora nonce de WordPress y `credentials: 'same-origin'`.
- Las rutas de administración de base de datos exigen `manage_options`.

## Análisis de solicitudes del frontend

### Cliente HTTP

`apiRequest()` concentra la construcción de headers, nonce, credenciales y errores. Es una buena base, pero no ofrece:

- cancelación mediante `AbortSignal`;
- timeout;
- deduplicación de requests idénticas en curso;
- reintentos controlados para errores transitorios;
- telemetría de duración, endpoint y correlación de acciones.

El proyecto inicializa TanStack Query mediante `QueryClientProvider`, pero no usa `useQuery`, `useMutation` ni `queryClient`. Por tanto, la caché, invalidación, cancelación y deduplicación se implementan parcialmente de forma manual entre Context y Zustand.

### Recuento por flujo

| Flujo | Requests actuales | Evaluación |
| --- | ---: | --- |
| Inicio con proyecto existente | Al menos 8, sin contar la página de proyectos | Hay duplicación de campañas/montes y posible carrera entre proyectos |
| Cambio de proyecto | 4; 5 tras abrir dashboard o costos | Dos fases correctas, pero sin cancelación ni reutilización de producción |
| Abrir lista de proyectos con `P` proyectos | `2 x P`, secuenciales | N+1; la latencia crece linealmente |
| Alta/edición/baja de un costo | 2 | Mutación seguida de GET de campaña completo |
| Borrar un grupo de `N` costos | `2 x N`, con picos concurrentes | N DELETE y N GET idénticos; riesgo de snapshots fuera de orden |
| Guardar producción | 2 en paralelo | Operación compuesta no atómica |
| Extender historial `N` años | `N` POST y luego 1 GET | Concurrencia ilimitada; sin transacción global |

### 1. Inicio: solicitudes duplicadas y carrera de estado

Al iniciar, `AppContext` obtiene proyectos y llama a `changeProject()` sin esperar su resultado. Después vuelve a pedir campañas y montes para el primer proyecto. `changeProject()` ya había hecho esas mismas dos solicitudes para el proyecto seleccionado.

Si el proyecto almacenado en `localStorage` no es el primero, las dos cargas incluso consultan proyectos distintos y pueden actualizar el estado en orden no determinista.

Acción recomendada:

1. Resolver el proyecto activo antes de pedir datos dependientes.
2. Esperar una única llamada a `changeProject`.
3. Quitar la carga adicional de campañas/montes del bootstrap.
4. Proteger cada carga con `AbortController` o un ID de versión, ignorando respuestas antiguas.

### 2. Cambio de proyecto: falta de cancelación

`changeProject()` solicita campañas y montes en paralelo, y luego costos e inversiones batch en paralelo. El diseño batch es bueno, pero si el usuario cambia rápidamente A -> B, las respuestas de A pueden llegar después y reemplazar el estado de B.

Acción recomendada:

- cancelar solicitudes del proyecto anterior;
- usar claves de cache por proyecto y verificar que el proyecto activo siga siendo el solicitado antes de llamar a `set`;
- deshabilitar temporalmente el selector global mientras la transición esté en curso, o adoptar una política de “última acción gana”.

### 3. Pantalla de proyectos: N+1 secuencial

La página obtiene montes y campañas, uno detrás de otro, por cada proyecto para construir sus indicadores. Con 10 proyectos equivale a 20 requests y a 20 esperas seriales.

Acción recomendada:

- solución preferida: `GET /projects?include=summary`, con cantidad de campañas, cantidad de montes y superficie total calculadas en backend;
- transición: ejecutar las lecturas por proyecto en paralelo con límite de concurrencia;
- reutilizar campañas y montes ya cargados, en vez de volver a solicitarlos.

### 4. Producción: recargas repetidas al navegar

Dashboard y Costos solicitan todas las producciones de todas las campañas al montarse. `loadAllProductions()` utiliza el endpoint batch, pero no tiene TTL ni deduplicación; por ello cada navegación puede repetir el mismo request.

Acción recomendada:

- cargar producción al seleccionar proyecto;
- cachear por `projectId` y por versión/fecha de actualización;
- invalidar sólo la campaña afectada después de guardar o borrar producción;
- no usar `POST` para lecturas si el tamaño de los IDs permite un GET; si POST es necesario, la caché de aplicación debe ser explícita.

### 5. Costos: recargas por ítem y estado potencialmente obsoleto

Tras cada mutación, el store vuelve a pedir todos los costos de la campaña. Al borrar un grupo, `Promise.all` llama a `deleteCost` por cada fila; cada una dispara después su GET de campaña. Además de sobredimensionar la carga, respuestas desordenadas pueden aplicar al estado local una vista previa a la última eliminación.

Acción recomendada:

- actualizar el estado local a partir de la respuesta de la mutación;
- si se requiere reconciliación, hacer un único GET al finalizar el grupo;
- reemplazar el borrado por ítems con `DELETE /costs/batch`;
- no mezclar mutaciones paralelas y refetch individual sobre la misma colección.

### 6. Cache manual incompleta

El `DataCache` cubre costos e inversiones durante dos minutos, pero no guarda promesas en curso. Dos consumidores simultáneos que encuentran un miss realizan la misma petición. `clearAllData()` limpia Zustand, pero no el `DataCache`.

Además, las altas, ediciones y bajas de inversiones actualizan el estado local sin invalidar la entrada de cache del proyecto; al salir y volver puede mostrarse una versión anterior hasta expirar el TTL.

Acción recomendada:

- eliminar la caché manual a favor de TanStack Query, o ampliar la caché para incluir promesas en vuelo, invalidación por entidad y limpieza al cambiar de usuario;
- establecer claves como `['costs', projectId]`, `['investments', projectId]` y `['productions', projectId]`;
- invalidar únicamente las claves afectadas por cada mutación.

## Arquitectura objetivo sugerida

```text
Página / componente
        |
        v
TanStack Query (cache, dedupe, cancelación, invalidación)
        |
        v
services/api.ts (nonce, errores normalizados, signal)
        |
        v
REST controller (schema + permission callback de propiedad)
        |
        v
Servicio de dominio (validación proyecto/campaña/monte + transacción)
        |
        v
Repositorio / wpdb
```

Zustand debería quedar para estado puramente de interfaz y selección local: proyecto activo, campaña activa, paneles y formularios. Los datos remotos deben tener una única fuente de verdad en la caché de consultas.

## Plan de mejora priorizado

### Fase 1: consistencia y reducción inmediata

1. Crear validadores de relación proyecto-campaña-monte y aplicarlos a producción, costos e inversiones.
2. Eliminar la doble carga de inicio y añadir protección contra respuestas de cambios de proyecto anteriores.
3. Cambiar el borrado agrupado de costos para hacer una sola reconciliación final.
4. Invalidar correctamente costos, inversiones y producción tras mutaciones.

### Fase 2: simplificación de frontend

1. Migrar lecturas y mutaciones a TanStack Query.
2. Eliminar `DataCache` manual y las recargas desde páginas individuales.
3. Cargar datos de proyecto una sola vez y compartirlos por claves de consulta.
4. Instrumentar duración, cantidad de requests por acción y errores HTTP.

### Fase 3: endpoints de dominio

1. Añadir endpoint de resumen de proyectos.
2. Añadir endpoints batch transaccionales para campañas y costos.
3. Unificar la escritura de producción y resumen de campaña.
4. Normalizar schemas, DTOs y respuestas de todas las mutaciones.

## Verificación recomendada

- Medir en DevTools el waterfall para inicio, cambio de proyecto y borrado de grupo.
- Añadir pruebas de integración para combinaciones inválidas de proyecto/campaña/monte.
- Añadir pruebas de concurrencia: cambio A -> B rápido, doble clic de guardado y borrado múltiple.
- Registrar métricas de requests por acción y fijar presupuestos, por ejemplo: cambio de proyecto <= 4 requests y apertura de proyectos <= 2 requests.
