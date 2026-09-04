# Gestión de Zonas Geográficas

## Especificación funcional y técnica

---

# 1. Objetivo

Esta funcionalidad permite a los administradores de una cámara sectorial definir y gestionar zonas geográficas utilizadas para la segmentación estadística, el benchmarking y el análisis de costos de los proyectos productivos.

Las zonas geográficas no son seleccionadas manualmente por los productores.

Cada proyecto registra su ubicación administrativa real y el sistema determina automáticamente a qué zona estadística pertenece según las reglas territoriales definidas por los administradores.

La funcionalidad debe soportar zonificaciones complejas, incluyendo:

- Una provincia completa como una zona.
- Varias provincias completas agrupadas en una zona.
- Una provincia dividida en varias zonas.
- Una zona compuesta por fragmentos de diferentes provincias.
- Combinaciones de diferentes unidades territoriales.

---

# 2. Principio General

La ubicación física y administrativa de un proyecto es independiente de su clasificación estadística.

## Ubicación administrativa del proyecto

Cada proyecto debe registrar su ubicación mediante la jerarquía territorial:

```text
País
└── Provincia
    └── Departamento
        └── Municipio / Localidad
```

Ejemplo:

```text
País: Argentina
Provincia: Tucumán
Departamento: Burruyacú
Municipio: El Chañar
```

## Clasificación estadística

A partir de esa ubicación, el sistema determina:

```text
Zona Geográfica: NOA
```

La relación conceptual es:

```text
UBICACIÓN DEL PROYECTO
        │
        ▼
País
Provincia
Departamento
Municipio
        │
        ▼
MOTOR DE RESOLUCIÓN DE ZONAS
        │
        ▼
ZONA GEOGRÁFICA ESTADÍSTICA
```

---

# 3. Concepto de Zona Geográfica

Una Zona Geográfica es una agrupación de territorios administrativos definida por los administradores de una cámara.

Una zona puede contener cualquier combinación válida de territorios.

Conceptualmente:

```text
Zona
=
Conjunto de territorios administrativos
```

Ejemplo:

```text
Zona NOA

=
Tucumán
∪
Salta
∪
Catamarca
```

O bien:

```text
Zona BA Delta

=
Tigre
∪
San Fernando
```

O:

```text
Zona ER-Ctes Costa del Paraná

=
Fragmentos de Entre Ríos
∪
Fragmentos de Corrientes
```

Las zonas no están obligadas a respetar límites provinciales.

---

# 4. Casos de Uso Soportados

## 4.1 Asignación Provincial Unitaria

Una zona puede equivaler exactamente a una provincia completa.

### Caso real

```text
10 - Córdoba
```

La zona incluye todos los proyectos ubicados dentro de la provincia de Córdoba.

### Configuración

El administrador selecciona:

```text
☑ Córdoba
```

El sistema interpreta:

```text
Zona 10 - Córdoba
=
Todos los territorios descendientes de Córdoba
```

No es necesario seleccionar individualmente departamentos, municipios o localidades.

### Resultado

Todos los proyectos cuya provincia sea Córdoba serán asignados automáticamente a esta zona.

---

## 4.2 Agrupación Macro-Regional

Una zona puede estar formada por múltiples provincias completas.

### Caso real

```text
9 - NOA
```

Incluye:

```text
Tucumán
Salta
Catamarca
```

Otro ejemplo:

```text
8 - Santa Fe - Chaco
```

Incluye:

```text
Santa Fe
Chaco
```

### Configuración

El administrador selecciona múltiples provincias:

```text
☑ Tucumán
☑ Salta
☑ Catamarca
```

### Resultado

La zona queda definida como:

```text
NOA
=
Tucumán
∪ Salta
∪ Catamarca
```

Todos los proyectos pertenecientes a cualquiera de estas provincias serán asignados automáticamente a la zona.

---

## 4.3 Fraccionamiento Provincial

Una provincia puede dividirse en múltiples zonas independientes.

### Caso real

La provincia de Buenos Aires está dividida en:

```text
3 - BA Delta

4 - BA Sur

5 - BA Centro Norte

6 - BA Oeste
```

Cada zona contiene localidades específicas pertenecientes a la misma provincia.

### Ejemplo

Para crear la zona:

```text
3 - BA Delta
```

El administrador navega:

```text
Argentina
└── Buenos Aires
```

Y selecciona:

```text
☑ Tigre
☑ San Fernando
```

La zona queda definida como:

```text
BA Delta
=
Tigre
∪
San Fernando
```

La provincia de Buenos Aires pasa a tener estado:

```text
PARCIALMENTE ASIGNADA
```

Esto significa que parte de su territorio ya pertenece a una zona, mientras que otras localidades todavía pueden utilizarse para crear nuevas zonas.

---

## 4.4 Zonas Transprovinciales Fraccionadas

Una zona puede estar formada por fragmentos territoriales de diferentes provincias.

### Caso real

```text
7 - ER-Ctes (Costa del Paraná)
```

Incluye localidades específicas de:

```text
Entre Ríos
+
Corrientes
```

### Ejemplo conceptual

```text
Zona 7 - ER-Ctes Costa del Paraná

Entre Ríos
├── Localidad A
├── Localidad B
└── Localidad C

Corrientes
├── Localidad X
├── Localidad Y
└── Localidad Z
```

La zona se define como:

```text
Costa del Paraná
=
Fragmento Entre Ríos
∪
Fragmento Corrientes
```

La interfaz debe permitir al administrador navegar entre diferentes provincias y seleccionar territorios de todas ellas dentro de la misma operación.

---

# 5. Estructura Territorial

El sistema debe trabajar sobre una estructura jerárquica de territorios administrativos.

```text
País
└── Provincia
    └── Departamento
        └── Municipio / Localidad
```

La nomenclatura puede variar según el país.

Por ejemplo:

```text
Argentina
País
→ Provincia
→ Departamento
→ Municipio / Localidad
```

En otros países podrían existir:

```text
Estado
Región
Distrito
Municipio
```

Por esta razón, la arquitectura debe evitar depender de nombres específicos y utilizar tipos territoriales configurables.

---

# 6. Modelo Territorial Recomendado

Se recomienda utilizar una entidad genérica para representar cualquier territorio administrativo.

## AdministrativeTerritory

```text
administrative_territories
```

### Campos

```typescript
AdministrativeTerritory {
    id

    country_id

    parent_id

    name
    code

    type

    is_active

    created_at
    updated_at
}
```

### Tipos posibles

```typescript
enum AdministrativeTerritoryType {
    COUNTRY
    PROVINCE
    DEPARTMENT
    MUNICIPALITY
}
```

---

# 7. Ejemplo de Árbol Territorial

```text
Argentina
│
├── Tucumán
│   │
│   ├── Burruyacú
│   │   ├── El Chañar
│   │   └── ...
│   │
│   └── Trancas
│       ├── Trancas
│       └── ...
│
├── Salta
│
├── Corrientes
│
└── Buenos Aires
    │
    ├── Tigre
    │
    ├── San Fernando
    │
    ├── Bahía Blanca
    │
    └── ...
```

Cada nodo conoce su nodo padre mediante:

```text
parent_id
```

Esto permite navegar la jerarquía territorial.

---

# 8. Modelo de Zona Geográfica

## GeographicZone

Representa una zona estadística creada por una cámara.

```typescript
GeographicZone {
    id

    chamber_id
    country_id

    code
    name
    description

    is_active

    created_at
    updated_at
}
```

Ejemplo:

```text
id: 9

code: 9

name: NOA

country: Argentina
```

---

# 9. Relación entre Zonas y Territorios

Una zona puede contener uno o varios territorios.

Se utilizará una tabla de relación:

```text
geographic_zone_territories
```

## Modelo

```typescript
GeographicZoneTerritory {
    id

    geographic_zone_id
    territory_id

    created_at
}
```

Ejemplo:

```text
Zona NOA

territory_id → Tucumán
territory_id → Salta
territory_id → Catamarca
```

Otro ejemplo:

```text
Zona BA Delta

territory_id → Tigre
territory_id → San Fernando
```

Otro ejemplo:

```text
Zona Costa del Paraná

territory_id → Localidad Entre Ríos A
territory_id → Localidad Entre Ríos B
territory_id → Localidad Corrientes X
territory_id → Localidad Corrientes Y
```

---

# 10. Selección de Territorios Padres

La selección de un territorio padre implica conceptualmente la inclusión de todos sus descendientes.

## Ejemplo

Si se selecciona:

```text
Tucumán
```

El sistema interpreta:

```text
Tucumán
=
Todos sus departamentos
+
Todos sus municipios
+
Todas sus localidades
```

Esto permite seleccionar provincias completas sin necesidad de almacenar cada localidad individualmente.

---

# 11. Cobertura Territorial

El sistema debe poder determinar qué territorio está cubierto por cada zona.

La cobertura de una zona se calcula a partir de sus territorios seleccionados.

Ejemplo:

```text
Zona NOA

Territorio seleccionado:
Tucumán
```

La cobertura incluye:

```text
Tucumán
└── Todos sus descendientes
```

Por lo tanto, si posteriormente se intenta asignar:

```text
Burruyacú
```

a otra zona, el sistema debe detectar que Burruyacú ya está cubierto por NOA.

---

# 12. Regla de No Superposición

Una unidad territorial no puede pertenecer simultáneamente a dos zonas activas.

Esta regla es fundamental para evitar duplicaciones estadísticas.

## No permitido

```text
Tigre
→ BA Delta

Tigre
→ BA Centro Norte
```

## Problemas que evita

- Duplicación de productores.
- Duplicación de hectáreas.
- Distorsión de promedios.
- Doble contabilización de costos.
- Inclusión de un productor en múltiples benchmarks.

---

# 13. Detección de Conflictos

Antes de guardar una zona, el sistema debe analizar la cobertura territorial de todas las zonas activas.

## Conflicto Tipo 1: Territorio Exacto

Zona existente:

```text
BA Delta
→ Tigre
```

Nueva zona:

```text
BA Centro Norte
→ Tigre
```

Resultado:

```text
ERROR
Territorio ya asignado a otra zona.
```

---

## Conflicto Tipo 2: Padre Ya Asignado

Zona existente:

```text
NOA
→ Tucumán completa
```

Nueva zona:

```text
Zona Norte Especial
→ Burruyacú
```

Resultado:

```text
ERROR
Burruyacú ya está incluido dentro de la cobertura territorial de NOA.
```

---

## Conflicto Tipo 3: Descendiente Ya Asignado

Zona existente:

```text
BA Delta
→ Tigre
→ San Fernando
```

Nueva zona:

```text
Zona Buenos Aires
→ Buenos Aires completa
```

Resultado:

```text
ERROR
La provincia contiene territorios asignados previamente a otras zonas.
```

---

# 14. Estados de Disponibilidad Territorial

Para facilitar la administración de zonas, los territorios deben tener estados calculados.

## Estados

```text
AVAILABLE
PARTIALLY_ASSIGNED
FULLY_ASSIGNED
```

---

## AVAILABLE

Ninguna parte del territorio pertenece a una zona activa.

Ejemplo:

```text
Córdoba

Estado:
Disponible
```

---

## PARTIALLY_ASSIGNED

Parte del territorio pertenece a zonas activas.

Ejemplo:

```text
Buenos Aires

Asignado:
- Tigre
- San Fernando

Disponible:
- Resto del territorio
```

Estado:

```text
Parcialmente asignado
```

---

## FULLY_ASSIGNED

Todo el territorio está cubierto por una o más zonas.

Ejemplo:

```text
Córdoba
```

si fue seleccionada completa por:

```text
Zona 10 - Córdoba
```

Estado:

```text
Completamente asignado
```

También puede ocurrir que varias zonas cubran conjuntamente toda la provincia.

---

# 15. Interfaz de Administración

La creación y edición de zonas debe realizarse mediante un selector jerárquico de territorios.

## Componente recomendado

```text
Tree Multi Select
```

Ejemplo:

```text
Argentina
│
├── ☑ Tucumán
│
├── ☑ Salta
│
├── ☐ Buenos Aires [PARCIAL]
│   │
│   ├── 🔒 Tigre
│   │     Asignado a BA Delta
│   │
│   ├── 🔒 San Fernando
│   │     Asignado a BA Delta
│   │
│   ├── ☐ Bahía Blanca
│   │
│   └── ☐ Pergamino
│
├── ☐ Corrientes [PARCIAL]
│
└── ☐ Entre Ríos [PARCIAL]
```

---

# 16. Estados Visuales de la Interfaz

| Estado | Significado |
|---|---|
| Disponible | Puede seleccionarse |
| Parcial | Parte de sus descendientes está asignada |
| Completo | Todo el territorio está asignado |
| Seleccionado | Forma parte de la zona actual |
| Bloqueado | Pertenece a otra zona |
| Conflicto | La selección genera superposición |

---

# 17. Selección Múltiple Transprovincial

La interfaz no debe limitar al administrador a trabajar dentro de una única provincia.

El administrador debe poder realizar selecciones como:

```text
Entre Ríos
├── ☑ Localidad A
├── ☑ Localidad B
└── ☐ Localidad C

Corrientes
├── ☑ Localidad X
├── ☑ Localidad Y
└── ☐ Localidad Z
```

Todas estas selecciones deben formar parte de una única zona.

Al guardar:

```text
Zona:
ER-Ctes Costa del Paraná

Territorios:

Entre Ríos:
- Localidad A
- Localidad B

Corrientes:
- Localidad X
- Localidad Y
```

---

# 18. Flujo de Creación de Zona

```text
Administrador
      │
      ▼
Nueva Zona
      │
      ▼
Ingresar Código
      │
      ▼
Ingresar Nombre
      │
      ▼
Seleccionar País
      │
      ▼
Explorar Árbol Territorial
      │
      ▼
Seleccionar Territorios
      │
      ▼
Validar Cobertura y Conflictos
      │
      ├── Conflictos
      │       │
      │       ▼
      │   Corregir selección
      │
      └── Sin conflictos
              │
              ▼
           Guardar
              │
              ▼
      Activar Zona
              │
              ▼
   Recalcular Proyectos Afectados
```

---

# 19. Motor de Resolución de Zona

Cada proyecto debe ser asignado automáticamente a una zona.

El proyecto registra:

```text
country_id
province_id
department_id
municipality_id
```

El sistema debe buscar qué zona cubre la ubicación del proyecto.

## Proceso

```text
Proyecto creado o actualizado
            │
            ▼
Obtener ubicación administrativa
            │
            ▼
Obtener cadena de ancestros
            │
            ▼
Municipio
Departamento
Provincia
País
            │
            ▼
Buscar cobertura en zonas activas
            │
            ▼
Encontrar coincidencia
            │
            ▼
Asignar zona al proyecto
```

---

# 20. Ejemplo de Resolución

## Proyecto

```text
País:
Argentina

Provincia:
Buenos Aires

Departamento:
Tigre

Municipio:
Tigre
```

## Zona existente

```text
BA Delta

Territorios:
Tigre
San Fernando
```

## Resultado

```text
Proyecto
→ BA Delta
```

---

# 21. Ejemplo de Resolución Provincial

## Proyecto

```text
País:
Argentina

Provincia:
Tucumán

Departamento:
Burruyacú

Municipio:
El Chañar
```

## Zona existente

```text
NOA

Territorios:
Tucumán
Salta
Catamarca
```

## Resultado

```text
Proyecto
→ NOA
```

La coincidencia ocurre porque Tucumán es un ancestro territorial de El Chañar.

---

# 22. Regla de Unicidad de Zona

Cada proyecto debe pertenecer a una única zona geográfica activa.

```text
1 Proyecto
=
1 Zona
```

Esto garantiza que:

- Los costos no se dupliquen.
- Las hectáreas no se contabilicen dos veces.
- El benchmarking sea consistente.
- Los informes zonales sean confiables.

---

# 23. Proyectos Sin Zona

Puede ocurrir que un proyecto se encuentre en un territorio que todavía no fue asignado a ninguna zona.

Ejemplo:

```text
Proyecto:
Argentina
Misiones
Departamento X
Municipio Y
```

Pero ninguna zona incluye Misiones.

Resultado:

```text
geographic_zone_id = NULL
```

El proyecto puede seguir funcionando normalmente.

Sin embargo:

- No participará del benchmarking zonal.
- No aparecerá en estadísticas de una zona.
- Puede aparecer como "Sin zonificar" en el panel administrativo.

---

# 24. Modificación de la Ubicación del Proyecto

Si un usuario modifica la ubicación de un proyecto, el sistema debe recalcular automáticamente su zona.

Evento:

```text
PROJECT_LOCATION_UPDATED
```

Proceso:

```text
Ubicación anterior
        │
        ▼
Modificar ubicación
        │
        ▼
Resolver nueva zona
        │
        ▼
Actualizar geographic_zone_id
```

---

# 25. Modificación de una Zona

Cuando un administrador modifica los territorios de una zona, los proyectos afectados deben ser recalculados.

Ejemplo:

## Antes

```text
NOA

Tucumán
Salta
```

## Después

```text
NOA

Tucumán
Salta
Catamarca
```

El sistema debe:

```text
Buscar proyectos de Catamarca
        │
        ▼
Recalcular zona
        │
        ▼
Asignar NOA
```

---

# 26. Recálculo Masivo

El sistema debe contar con un mecanismo de recálculo masivo.

Eventos que requieren recálculo:

```text
ZONE_CREATED

ZONE_UPDATED

ZONE_ACTIVATED

ZONE_DEACTIVATED

ZONE_TERRITORY_ADDED

ZONE_TERRITORY_REMOVED

PROJECT_LOCATION_UPDATED
```

El recálculo puede ejecutarse:

- Inmediatamente.
- Mediante una cola de trabajos.
- Como proceso en segundo plano.

Para grandes volúmenes de datos se recomienda utilizar un proceso asíncrono.

---

# 27. Persistencia de la Zona en el Proyecto

Aunque la zona puede calcularse dinámicamente, se recomienda almacenar la zona actualmente asignada en el proyecto.

Ejemplo:

```typescript
ProductionProject {
    id

    country_id
    province_id
    department_id
    municipality_id

    geographic_zone_id
}
```

Esto facilita consultas estadísticas rápidas.

Sin embargo:

```text
geographic_zone_id
```

debe considerarse un dato derivado.

La fuente de verdad sigue siendo:

```text
Ubicación administrativa
+
Definición activa de zonas
```

---

# 28. Recomendación de Auditoría

Se recomienda mantener historial de cambios de zonas.

## ZoneHistory

```typescript
GeographicZoneHistory {
    id

    geographic_zone_id

    action

    previous_data
    new_data

    changed_by

    created_at
}
```

Acciones posibles:

```text
ZONE_CREATED

ZONE_UPDATED

TERRITORY_ADDED

TERRITORY_REMOVED

ZONE_ACTIVATED

ZONE_DEACTIVATED
```

Esto permitirá conocer cómo estaba definida una zona en diferentes momentos históricos.

---

# 29. Consideración Histórica para Estadísticas

Las zonas pueden cambiar con el tiempo.

Ejemplo:

```text
2026

NOA
=
Tucumán
+
Salta
```

Posteriormente:

```text
2028

NOA
=
Tucumán
+
Salta
+
Catamarca
```

El sistema debe definir cómo se comportarán los informes históricos.

## Opción recomendada

Mantener versionado o historial de las definiciones territoriales.

De esta manera, un informe histórico puede saber qué definición de zona estaba vigente en una determinada campaña.

---

# 30. Integración con Benchmarking

La zona geográfica será una de las variables principales para construir grupos de comparación.

Ejemplo:

```text
Productor

País:
Argentina

Zona:
NOA

Escala:
Mediano

Arquetipo:
Maduro
```

El grupo estadístico será:

```text
Argentina
+
NOA
+
Mediano
+
Maduro
```

La consulta conceptual:

```sql
WHERE country = 'Argentina'
AND geographic_zone = 'NOA'
AND production_scale = 'MEDIUM'
AND project_archetype = 'MATURE'
```

---

# 31. Integración con Monitor de Salud de Datos

Las zonas también serán utilizadas para calcular:

- Cantidad de productores por zona.
- Cantidad de proyectos por zona.
- Hectáreas representadas.
- Cobertura territorial.
- Tasa de participación.
- Densidad estadística.
- Cumplimiento de la regla de muestra mínima.

Ejemplo:

```text
Zona NOA

Productores:
45

Proyectos:
52

Hectáreas:
1.840

Campañas cerradas:
38
```

---

# 32. Integración con Representatividad Zonal

Cada zona podrá tener una estimación de superficie productiva total.

Ejemplo:

```text
Zona:
NOA

Hectáreas estimadas sectoriales:
2.500 Ha

Hectáreas registradas:
1.750 Ha
```

El sistema calcula:

```text
Cobertura
=
Hectáreas registradas
/
Hectáreas estimadas
× 100
```

Resultado:

```text
70%
```

---

# 33. Reglas de Negocio

## RN-ZONE-01

Las zonas son creadas y administradas exclusivamente por usuarios administradores autorizados.

---

## RN-ZONE-02

Los productores no seleccionan manualmente su zona estadística.

---

## RN-ZONE-03

La zona de un proyecto se determina automáticamente a partir de su ubicación administrativa.

---

## RN-ZONE-04

Una zona puede contener uno o múltiples territorios.

---

## RN-ZONE-05

Una zona puede contener provincias completas.

---

## RN-ZONE-06

Una zona puede contener múltiples provincias completas.

---

## RN-ZONE-07

Una provincia puede dividirse entre múltiples zonas.

---

## RN-ZONE-08

Una zona puede contener fragmentos de diferentes provincias.

---

## RN-ZONE-09

No se permite la superposición territorial entre zonas activas.

---

## RN-ZONE-10

La selección de un territorio padre implica la cobertura de todos sus territorios descendientes.

---

## RN-ZONE-11

No se puede seleccionar un territorio padre si alguno de sus descendientes ya pertenece a otra zona activa.

---

## RN-ZONE-12

Un proyecto solo puede pertenecer a una zona activa.

---

## RN-ZONE-13

Un proyecto puede existir temporalmente sin zona asignada.

---

## RN-ZONE-14

La modificación de una zona requiere recalcular los proyectos afectados.

---

## RN-ZONE-15

La modificación de la ubicación de un proyecto requiere recalcular su zona.

---

## RN-ZONE-16

Las zonas deben pertenecer a un país específico.

---

## RN-ZONE-17

Las zonas deben pertenecer a una cámara u organización específica.

---

# 34. Requisitos Funcionales

## RF-ZONE-01

El sistema debe permitir crear zonas geográficas.

## RF-ZONE-02

El sistema debe permitir editar zonas geográficas.

## RF-ZONE-03

El sistema debe permitir activar y desactivar zonas.

## RF-ZONE-04

El sistema debe permitir seleccionar provincias completas.

## RF-ZONE-05

El sistema debe permitir seleccionar departamentos específicos.

## RF-ZONE-06

El sistema debe permitir seleccionar municipios o localidades específicas.

## RF-ZONE-07

El sistema debe permitir seleccionar territorios de diferentes provincias para una misma zona.

## RF-ZONE-08

El sistema debe detectar superposiciones territoriales.

## RF-ZONE-09

El sistema debe mostrar el estado de disponibilidad territorial.

## RF-ZONE-10

El sistema debe asignar automáticamente una zona a cada proyecto.

## RF-ZONE-11

El sistema debe recalcular la zona cuando cambia la ubicación del proyecto.

## RF-ZONE-12

El sistema debe recalcular proyectos cuando cambia una definición de zona.

## RF-ZONE-13

El sistema debe permitir identificar proyectos sin zona asignada.

## RF-ZONE-14

El sistema debe mantener auditoría de cambios administrativos.

---

# 35. Requisitos de Interfaz

## UI-ZONE-01

Debe existir una pantalla de administración de zonas.

## UI-ZONE-02

Debe existir un listado de zonas existentes.

El listado debe mostrar:

- Código.
- Nombre.
- País.
- Estado.
- Cantidad de territorios.
- Cantidad de proyectos.
- Cantidad de productores.
- Hectáreas representadas.

---

## UI-ZONE-03

La creación de zonas debe utilizar un árbol territorial.

---

## UI-ZONE-04

El árbol debe permitir selección múltiple.

---

## UI-ZONE-05

El árbol debe permitir navegar entre provincias sin perder las selecciones realizadas.

---

## UI-ZONE-06

Los territorios parcialmente asignados deben tener una representación visual diferente.

---

## UI-ZONE-07

Los territorios completamente asignados deben mostrarse como no disponibles para nuevas zonas.

---

## UI-ZONE-08

Los conflictos deben mostrarse antes de guardar.

---

# 36. Requisitos Técnicos

## TECH-ZONE-01

La estructura territorial debe utilizar una entidad jerárquica basada en `parent_id`.

---

## TECH-ZONE-02

Las zonas deben relacionarse con territorios mediante una tabla intermedia.

---

## TECH-ZONE-03

La lógica de asignación debe estar separada de la interfaz.

Se recomienda implementar un servicio:

```text
GeographicZoneResolver
```

---

## TECH-ZONE-04

El servicio debe recibir una ubicación y devolver:

```typescript
{
    zone_id,
    zone_name,
    resolution_status
}
```

---

## TECH-ZONE-05

La detección de conflictos debe implementarse como un servicio independiente.

Ejemplo:

```text
GeographicZoneConflictService
```

---

## TECH-ZONE-06

Las operaciones masivas deben poder ejecutarse en segundo plano.

---

# 37. Servicios Recomendados

## GeographicZoneService

Responsabilidades:

```text
Crear zona
Editar zona
Activar zona
Desactivar zona
Eliminar zona
```

---

## GeographicZoneResolver

Responsabilidades:

```text
Resolver zona de un proyecto
Buscar cobertura territorial
Determinar coincidencia
Actualizar asignación
```

---

## GeographicZoneConflictService

Responsabilidades:

```text
Detectar superposición
Validar territorios
Validar padres
Validar descendientes
```

---

## GeographicZoneRecalculationService

Responsabilidades:

```text
Recalcular proyectos afectados
Procesar cambios de zonas
Procesar modificaciones territoriales
```

---

# 38. Casos de Prueba Obligatorios

## Caso 1

Crear una zona con una provincia completa.

```text
Zona:
Córdoba

Territorio:
Córdoba
```

Resultado esperado:

```text
Todos los proyectos de Córdoba
→ Zona Córdoba
```

---

## Caso 2

Crear una zona con tres provincias.

```text
Zona:
NOA

Territorios:
Tucumán
Salta
Catamarca
```

Resultado esperado:

```text
Todos los proyectos de las tres provincias
→ Zona NOA
```

---

## Caso 3

Dividir Buenos Aires.

```text
BA Delta:
Tigre
San Fernando

BA Sur:
Bahía Blanca
```

Resultado esperado:

```text
Cada proyecto pertenece únicamente a su zona correspondiente.
```

---

## Caso 4

Intentar seleccionar Buenos Aires completa después de asignar Tigre.

Resultado esperado:

```text
ERROR

La provincia contiene territorios asignados a otras zonas.
```

---

## Caso 5

Crear zona transprovincial.

```text
Zona:
ER-Ctes Costa del Paraná

Territorios:

Entre Ríos:
Localidad A
Localidad B

Corrientes:
Localidad X
Localidad Y
```

Resultado esperado:

```text
La zona se guarda correctamente.
```

---

## Caso 6

Intentar asignar una localidad a dos zonas.

Resultado esperado:

```text
ERROR

Territorio ya asignado.
```

---

## Caso 7

Proyecto sin zona.

```text
Proyecto:
Provincia no incluida en ninguna zona.
```

Resultado esperado:

```text
geographic_zone_id = NULL
```

---

## Caso 8

Modificar una zona.

Agregar:

```text
Catamarca
```

a:

```text
NOA
```

Resultado esperado:

```text
Todos los proyectos de Catamarca son recalculados.
```

---

# 39. Arquitectura Final

La arquitectura conceptual final será:

```text
                        ADMINISTRATIVE TERRITORIES

                                País
                                 │
                           Provincias
                                 │
                          Departamentos
                                 │
                       Municipios / Localidades


                                      │
                                      │
                                      ▼


                         GEOGRAPHIC ZONE TERRITORIES

                              Zona NOA
                              ├── Tucumán
                              ├── Salta
                              └── Catamarca


                              Zona BA Delta
                              ├── Tigre
                              └── San Fernando


                              Zona Costa Paraná
                              ├── ER Localidad A
                              ├── ER Localidad B
                              ├── CTES Localidad X
                              └── CTES Localidad Y


                                      │
                                      ▼


                              PRODUCTION PROJECTS

                              Proyecto A
                              Zona: NOA

                              Proyecto B
                              Zona: BA Delta

                              Proyecto C
                              Zona: Costa Paraná
```

---

# 40. Decisión Arquitectónica Final

La zona geográfica debe ser tratada como una clasificación estadística independiente de la ubicación física del proyecto.

La relación correcta es:

```text
PROYECTO
    │
    ├── UBICACIÓN REAL
    │
    │   País
    │   Provincia
    │   Departamento
    │   Municipio
    │
    └── CLASIFICACIÓN ESTADÍSTICA
            │
            └── Zona Geográfica
```

La zona se determina mediante las reglas territoriales definidas por los administradores.

No debe ser seleccionada manualmente por el productor.

El modelo debe soportar:

```text
Una provincia
        │
        ▼
Una zona


Varias provincias
        │
        ▼
Una zona


Una provincia
        │
        ├── Zona A
        ├── Zona B
        ├── Zona C
        └── Zona D


Fragmentos de Provincia A
+
Fragmentos de Provincia B
        │
        ▼
Una zona
```

Esta arquitectura permite representar correctamente las necesidades actuales de zonificación de CAPPECAN y mantiene suficiente flexibilidad para futuras cámaras, países y configuraciones territoriales.

---

# 41. Resultado Esperado

El flujo final para el productor será simple:

```text
Crear Proyecto
      │
      ▼
Seleccionar ubicación

País
Provincia
Departamento
Municipio
      │
      ▼
Guardar Proyecto
      │
      ▼
Sistema resuelve automáticamente la zona
      │
      ▼
Proyecto participa en el grupo estadístico correcto
```

El productor nunca necesita conocer ni seleccionar manualmente la zona.

La complejidad de la zonificación queda completamente centralizada en los administradores y en el motor de resolución territorial.

Esto garantiza:

- Menos errores humanos.
- Mayor consistencia estadística.
- Benchmarking correcto.
- Control institucional de la zonificación.
- Flexibilidad para representar regiones complejas.
- Evitar superposición de productores.
- Evitar duplicación de datos.
- Adaptabilidad a diferentes países.