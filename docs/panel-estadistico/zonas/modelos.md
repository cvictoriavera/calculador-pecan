# Especificación Técnica: Modelos de Datos y Tipos - Gestión Geográfica y Zonas

Este documento especifica los modelos de datos, estructuras de clases DTO (Data Transfer Objects), interfaces TypeScript y Enums actualizados según el nuevo esquema normalizado de base de datos (`wp_pecan_countries`, `wp_pecan_geographic_territories`, `wp_pecan_geographic_zones`, `wp_pecan_geographic_zone_territories` y `wp_pecan_projects`).

---

## 1. Enums y Constantes

### 1.1 `TerritoryAvailabilityState`
Define los estados calculados de disponibilidad territorial para el selector UI y el motor de validación.

```typescript
export enum TerritoryAvailabilityState {
  AVAILABLE = 'AVAILABLE',                 // Totalmente libre
  PARTIALLY_ASSIGNED = 'PARTIALLY_ASSIGNED', // Algunos descendientes están asignados a zonas
  FULLY_ASSIGNED = 'FULLY_ASSIGNED',       // Totalmente ocupado por otra(s) zona(s)
  SELECTED = 'SELECTED',                   // Seleccionado en la zona actual en edición
  BLOCKED = 'BLOCKED'                      // Bloqueado por pertenecer a otra zona activa
}
```

---

### 1.2 `GeographicZoneStatus`

```typescript
export enum GeographicZoneStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}
```

---

## 2. Interfaces TypeScript (Frontend)

### 2.1 `Country`

```typescript
export interface Country {
  id: number;
  name: string;
  iso_code_2: string;
  iso_code_3: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}
```

---

### 2.2 `GeographicTerritory`

```typescript
export interface GeographicTerritory {
  id: number;
  country_id: number;
  parent_id: number | null;
  name: string;
  normalized_name: string;
  territory_type: string; // ej. 'province', 'state', 'department', 'municipality', 'locality'
  level_number: number;   // 1, 2, 3...
  external_source: string | null;
  external_id: string | null;
  is_active: boolean;
  availability_state?: TerritoryAvailabilityState;
  assigned_zone_id?: number | null;
  assigned_zone_name?: string | null;
  children?: GeographicTerritory[];
}
```

---

### 2.3 `GeographicZone`

```typescript
export interface GeographicZone {
  id: number;
  country_id: number;
  country_name?: string;
  code: string | null;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: number | null;
  territories_count?: number;
  projects_count?: number;
  producers_count?: number;
  registered_hectares?: number;
  territory_ids?: number[];
  territories?: GeographicTerritory[];
  created_at: string;
  updated_at: string | null;
}
```

---

### 2.4 DTOs para Creación y Edición de Zonas

```typescript
export interface CreateGeographicZoneDTO {
  country_id: number;
  code?: string;
  name: string;
  description?: string;
  is_active?: boolean;
  territory_ids: number[];
}

export interface UpdateGeographicZoneDTO {
  country_id?: number;
  code?: string;
  name?: string;
  description?: string;
  is_active?: boolean;
  territory_ids?: number[];
}
```

---

### 2.5 DTO para Detección de Conflictos

```typescript
export interface TerritoryConflict {
  territory_id: number;
  territory_name: string;
  conflict_type: 'EXACT_MATCH' | 'PARENT_ALREADY_ASSIGNED' | 'CHILD_ALREADY_ASSIGNED';
  assigned_zone_id: number;
  assigned_zone_name: string;
  message: string;
}

export interface ConflictCheckResult {
  has_conflicts: boolean;
  conflicts: TerritoryConflict[];
}
```

---

### 2.6 DTO para Resolución de Zona de un Proyecto

```typescript
export interface ZoneResolutionResult {
  project_id: number;
  country_id: number;
  geographic_territory_id: number | null;
  geographic_zone_id: number | null;
  geographic_zone_name: string | null;
  geographic_zone_code: string | null;
  resolution_status: 'ASSIGNED' | 'UNASSIGNED';
  resolved_at_level?: number | null; // Nivel jerárquico donde se encontró la coincidencia (1, 2 o 3)
}
```

---

## 3. Clases PHP (Backend DTOs)

### 3.1 `CCP_Country_DTO`

```php
class CCP_Country_DTO {
    public int $id;
    public string $name;
    public string $iso_code_2;
    public ?string $iso_code_3;
    public bool $is_active;
}
```

---

### 3.2 `CCP_Geographic_Territory_DTO`

```php
class CCP_Geographic_Territory_DTO {
    public int $id;
    public int $country_id;
    public ?int $parent_id;
    public string $name;
    public string $normalized_name;
    public string $territory_type;
    public int $level_number;
    public ?string $external_source;
    public ?string $external_id;
    public bool $is_active;
    public ?string $availability_state;
    public ?int $assigned_zone_id;
    public ?string $assigned_zone_name;
    public array $children = [];
}
```

---

### 3.3 `CCP_Geographic_Zone_DTO`

```php
class CCP_Geographic_Zone_DTO {
    public int $id;
    public int $country_id;
    public ?string $code;
    public string $name;
    public ?string $description;
    public bool $is_active;
    public ?int $created_by;
    public array $territory_ids = [];
    public int $projects_count = 0;
    public int $producers_count = 0;
    public float $registered_hectares = 0.0;
}
```
