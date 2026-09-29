# Especificación Técnica: Servicios Backend (PHP) - Gestión Geográfica y Zonas

Este documento especifica la arquitectura de servicios backend en PHP encargados del almacenamiento local, importación de datos externos, navegación de jerarquías territoriales, resolución automática de zonas por `parent_id`, detección de conflictos y recálculo masivo.

---

## 1. Arquitectura de Servicios Backend

La lógica geográfica se organiza en cuatro servicios principales:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CCP_Geographic_Import_Service                          │
│ (Importación y sincronización desde fuentes externas: GeoRef AR, IBGE, etc.) │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CCP_Geographic_Hierarchy_Service                       │
│ (Gestión de wp_pecan_countries y wp_pecan_geographic_territories con        │
│  estructura jerárquica por parent_id y nivel administrativo level_number)   │
└──────────────────────┬──────────────────────────────┬───────────────────────┘
                       │                              │
                       ▼                              ▼
┌─────────────────────────────┐  ┌───────────────────────────────────────────┐
│CCP_Geographic_Zone_Resolver │  │CCP_Geographic_Zone_Validation_Service     │
│(Resolución recursiva por    │  │(Validación de no superposición,           │
│ parent_id para proyectos)   │  │ disponibilidad y reglas territoriales)    │
└──────────────┬──────────────┘  └───────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│    CCP_Geographic_Zone_Service & Recalc    │
│ (CRUD de Zonas en wp_pecan_geographic_zones │
│  y recálculo masivo de proyectos afectados) │
└─────────────────────────────────────────────┘
```

---

## 2. Descripción de Servicios y Algoritmos

### 2.1 `CCP_Geographic_Import_Service`

Encargado de la carga inicial y eventuales actualizaciones de divisiones administrativas a partir de APIs externas.

#### Responsabilidades:
- Consumir servicios de datos oficiales (ej: API GeoRef Argentina, IBGE Brasil, etc.).
- Normalizar nombres (`normalized_name`), códigos e identidades externas (`external_source`, `external_id`).
- Insertar o actualizar registros en `wp_pecan_countries` y `wp_pecan_geographic_territories`.
- Garantizar que los datos se almacenen en la base de datos local para que la aplicación diaria no dependa de APIs externas.

#### Métodos Clave:
* `import_country_territories(string $country_iso, string $source): int`
* `sync_external_territory(array $external_data): CCP_Geographic_Territory_DTO`

---

### 2.2 `CCP_Geographic_Hierarchy_Service`

Provee métodos para consultar la estructura territorial interna sin depender de servicios externos.

#### Responsabilidades:
- Cargar las divisiones territoriales iniciales (Provincia, Departamento/Municipio, Localidad) dinámicamente desde el archivo `public/geo-argentina.json` mediante `CCP_Geographic_Seeder` durante la activación del plugin.
- Obtener países activos (`wp_pecan_countries`).
- Construir árboles territoriales dinámicos según `country_id` y `parent_id`.
- Propagar recursivamente los estados de disponibilidad y bloqueo (`availability_state = 'BLOCKED'` y `assigned_zone_name`) hacia todas las divisiones y localidades descendientes cuando un territorio padre pertenece a una zona activa.
- Reconstruir la ruta completa de ancestros de un territorio dado (ej: `El Chañar` -> `Burruyacú` -> `Tucumán` -> `Argentina`).

#### Métodos Clave:
* `get_countries(bool $active_only = true): array`
* `get_territory_by_id(int $territory_id): ?CCP_Geographic_Territory_DTO`
* `get_territory_ancestors(int $territory_id): array`: Devuelve la lista ordenada de ancestros desde el territorio específico hasta el nivel 1 (Provincia/Estado).
* `get_territory_tree(int $country_id, ?int $exclude_zone_id = null): array`: Devuelve el árbol con los estados de disponibilidad y bloqueo heredado inyectados.

---

### 2.3 `CCP_Geographic_Zone_Resolver`

Motor encargado de la asignación automática de zonas a los proyectos según su `geographic_territory_id`.

#### Algoritmo de Asignación Recursiva por `parent_id`:

```text
Entrada: project_id, geographic_territory_id

1. Inicializar $current_territory_id = project.geographic_territory_id
2. Mientras $current_territory_id no sea NULL:
   a. Buscar en wp_pecan_geographic_zone_territories si $current_territory_id
      está vinculado a una zona activa (status = 'active' o is_active = 1).
   b. Si se encuentra una coincidencia:
      - Asignar project.geographic_zone_id = $zone_id
      - Retornar status ASSIGNED.
   c. Si NO se encuentra:
      - Obtener parent_id de $current_territory_id en wp_pecan_geographic_territories.
      - Asignar $current_territory_id = parent_id.
3. Si la búsqueda llega al nivel superior sin coincidencia:
   - Asignar project.geographic_zone_id = NULL
   - Retornar status UNASSIGNED.
```

#### Métodos Clave:
* `resolve_project_zone(int $project_id): ZoneResolutionResult`
* `find_zone_for_territory(int $territory_id): ?CCP_Geographic_Zone_DTO`

---

### 2.4 `CCP_Geographic_Zone_Validation_Service`

Garantiza el cumplimiento de las **Reglas de Integridad Territorial**:

1. **Regla 1 (Unicidad):** Un territorio no debe pertenecer simultáneamente a dos zonas activas.
2. **Regla 2 (No superposición con descendientes):** No se puede incluir una provincia completa si alguna de sus localidades o departamentos ya pertenece a otra zona activa.
3. **Regla 3 (Selección Padre incluye Hijos):** Al seleccionar un territorio padre (ej. Provincia de Tucumán), se se incluye automáticamente toda su jerarquía descendente sin guardar individualmente cada localidad en `wp_pecan_geographic_zone_territories`.

#### Métodos Clave:
* `validate_zone_territories(int $country_id, array $territory_ids, ?int $exclude_zone_id = null): array`
* `calculate_territory_availability(int $territory_id, array $assigned_map): string`: Retorna `AVAILABLE`, `PARTIALLY_ASSIGNED`, `FULLY_ASSIGNED` o `BLOCKED`.

---

### 2.5 `CCP_Geographic_Zone_Service`

Maneja el CRUD de `wp_pecan_geographic_zones` y la sincronización con `wp_pecan_geographic_zone_territories`. Dispara el recálculo automático de proyectos cuando una zona es creada, modificada o desactivada.

#### Métodos Clave:
* `create_zone(array $data, int $user_id): CCP_Geographic_Zone_DTO`
* `update_zone(int $zone_id, array $data, int $user_id): CCP_Geographic_Zone_DTO`
* `delete_zone(int $zone_id): bool`
* `recalculate_projects_for_zone(int $zone_id): int`

---

### 2.6 Control de Permisos para `admin_country` (Integración ACF)

Servicio/helper encargado de validar que un usuario con el rol `admin_country` solo gestione información de su país asignado.

#### Lógica de Resolución del País del Usuario:
1. Obtener roles del usuario actual via `wp_get_current_user()`.
2. Si posee el rol `administrator` (Super Admin), no aplica restricciones de país (`country_id = null`, acceso total).
3. Si posee el rol `admin_country`:
   - Consultar el campo personalizado ACF `pais` del usuario: `get_field('pais', 'user_' . $user_id)` o `get_user_meta($user_id, 'pais', true)`.
   - Mapear el valor retornado por ACF (ej. `"Argentina"`, `"AR"` o ID) contra la tabla `wp_pecan_countries`.
   - Retornar el `country_id` asignado.
4. En las operaciones de escritura (Crear, Editar, Activar/Desactivar, Eliminar Zonas), se verifica:
   - `IF user_role == 'admin_country' AND target_zone.country_id != user_assigned_country_id THEN RETURN 403 Forbidden`.

#### Métodos Clave:
* `get_user_assigned_country_id(int $user_id): ?int`
* `can_user_manage_country_zone(int $user_id, int $country_id): bool`
* `filter_zones_query_for_user(array $args, int $user_id): array`
