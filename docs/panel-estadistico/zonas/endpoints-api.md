# Especificación Técnica: Endpoints de la REST API - Gestión Geográfica y Zonas

Este documento especifica todos los endpoints REST expuestos en el namespace `/calculador-pecan/v1` para la gestión de Países, Árbol Territorial, Zonas Geográficas, Detección de Conflictos y Resolución Automática de Proyectos.

---

## 1. Autenticación y Autorización

* **Namespace Base:** `/wp-json/calculador-pecan/v1`
* **Cabecera de Autenticación:** Cookie de sesión WordPress o Nonce en cabecera `X-WP-Nonce`.
* **Endpoints Públicos/Lectura:** Accesibles para cualquier usuario autenticado (`current_user_can('read')`).
* **Endpoints Administrativos:** Restringidos a usuarios con rol `administrator` / `manage_options`.

---

## 2. Resumen de Endpoints

### 2.1 Países y Territorios
| Método | Endpoint | Permisos | Descripción |
|---|---|---|---|
| `GET` | `/countries` | Autenticado | Listar países soportados (`wp_pecan_countries`) |
| `GET` | `/territories` | Autenticado | Listar divisiones territoriales filtradas por `country_id`, `parent_id` o `level_number` |
| `GET` | `/territories/tree` | Autenticado | Obtener árbol jerárquico de un país con estados de disponibilidad |

### 2.2 Zonas Geográficas
| Método | Endpoint | Permisos | Descripción |
|---|---|---|---|
| `GET` | `/zones` | Autenticado | Listar zonas geográficas (filtro por `country_id`, `is_active`) |
| `GET` | `/zones/{id}` | Autenticado | Obtener detalle de una zona y sus `geographic_territory_id` vinculados |
| `POST` | `/zones` | Admin | Crear nueva zona geográfica asociando territorios |
| `PUT` | `/zones/{id}` | Admin | Modificar zona existente y sus territorios |
| `DELETE` | `/zones/{id}` | Admin | Desactivar / Eliminar (baja lógica `is_active = 0`) |
| `POST` | `/zones/check-conflicts` | Admin | Validar en tiempo real si una selección genera superposición |
| `POST` | `/zones/resolve-project` | Autenticado | Resolver y actualizar la zona de un proyecto por su `geographic_territory_id` |
| `POST` | `/zones/recalculate-all` | Admin | Disparar recálculo masivo de zonas para todos los proyectos |

---

## 3. Detalle de Endpoints principales

### 3.1 `GET /countries`

Obtiene la lista de países disponibles en la plataforma.

#### Ejemplo de Respuesta (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Argentina",
      "iso_code_2": "AR",
      "iso_code_3": "ARG",
      "is_active": true
    },
    {
      "id": 2,
      "name": "Brasil",
      "iso_code_2": "BR",
      "iso_code_3": "BRA",
      "is_active": true
    },
    {
      "id": 3,
      "name": "Uruguay",
      "iso_code_2": "UY",
      "iso_code_3": "URY",
      "is_active": true
    }
  ]
}
```

---

### 3.2 `GET /territories/tree`

Devuelve el árbol territorial del país indicado con los estados de disponibilidad (`AVAILABLE`, `PARTIALLY_ASSIGNED`, `FULLY_ASSIGNED`, `BLOCKED`).

#### Parámetros Query:
* `country_id` (obligatorio, int): ej. `1`
* `exclude_zone_id` (opcional, int): ID de la zona en edición para permitir seleccionar sus propios territorios.

#### Ejemplo de Respuesta (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "country_id": 1,
      "parent_id": null,
      "name": "Tucumán",
      "normalized_name": "tucuman",
      "territory_type": "province",
      "level_number": 1,
      "availability_state": "FULLY_ASSIGNED",
      "assigned_zone_id": 1,
      "assigned_zone_name": "NOA"
    },
    {
      "id": 12,
      "country_id": 1,
      "parent_id": null,
      "name": "Buenos Aires",
      "normalized_name": "buenos aires",
      "territory_type": "province",
      "level_number": 1,
      "availability_state": "PARTIALLY_ASSIGNED",
      "children": [
        {
          "id": 437,
          "country_id": 1,
          "parent_id": 12,
          "name": "Tigre",
          "normalized_name": "tigre",
          "territory_type": "municipality",
          "level_number": 2,
          "availability_state": "BLOCKED",
          "assigned_zone_id": 2,
          "assigned_zone_name": "BA Delta"
        },
        {
          "id": 439,
          "country_id": 1,
          "parent_id": 12,
          "name": "Bahía Blanca",
          "normalized_name": "bahia blanca",
          "territory_type": "municipality",
          "level_number": 2,
          "availability_state": "AVAILABLE"
        }
      ]
    }
  ]
}
```

---

### 3.3 `GET /zones`

Retorna las zonas geográficas creadas filtradas por país.

#### Parámetros Query:
* `country_id` (opcional, int): ej. `1`
* `is_active` (opcional, boolean): `true` | `false` | `all`. Defecto: `true`.

#### Ejemplo de Respuesta (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "country_id": 1,
      "country_name": "Argentina",
      "code": "1",
      "name": "NOA",
      "description": "Noroeste Argentino (Tucumán, Salta, Catamarca)",
      "is_active": true,
      "territories_count": 3,
      "projects_count": 52,
      "producers_count": 45,
      "registered_hectares": 1750.00,
      "created_at": "2026-09-03 14:00:00"
    }
  ]
}
```

---

### 3.4 `POST /zones`

Crea una zona asociando uno o más territorios (`geographic_territory_id`).

#### Cuerpo de la Petición (JSON):
```json
{
  "country_id": 1,
  "code": "6",
  "name": "ER-Ctes Costa del Paraná",
  "description": "Zona transprovincial en la costa del Paraná",
  "is_active": true,
  "territory_ids": [501, 502, 610, 611]
}
```

#### Respuestas:
* `201 Created`: Zona creada exitosamente.
* `409 Conflict`: Si un territorio ya pertenece a otra zona activa.

```json
{
  "success": false,
  "error": "TERRITORY_CONFLICT",
  "message": "Uno o más territorios ya están asignados a otra zona activa.",
  "conflicts": [
    {
      "territory_id": 501,
      "territory_name": "Localidad A",
      "conflict_type": "EXACT_MATCH",
      "assigned_zone_id": 7,
      "assigned_zone_name": "Zona Entre Ríos Centro"
    }
  ]
}
```

---

### 3.5 `POST /zones/resolve-project`

Dispara la resolución y actualización de `geographic_zone_id` para un proyecto específico basándose en su `geographic_territory_id`.

#### Cuerpo de la Petición:
```json
{
  "project_id": 15
}
```

#### Respuesta (`200 OK`):
```json
{
  "success": true,
  "data": {
    "project_id": 15,
    "country_id": 1,
    "geographic_territory_id": 100,
    "geographic_zone_id": 1,
    "geographic_zone_name": "NOA",
    "resolution_status": "ASSIGNED",
    "resolved_at_level": 1
  }
}
```
