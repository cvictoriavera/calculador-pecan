# Especificación Técnica: Componentes Frontend (React / TS) - Gestión Geográfica y Zonas

Este documento especifica los componentes React, interfaces de usuario, estado global/local y servicios TypeScript actualizados para la gestión geográfica multi-país, selección de ubicación de proyectos por parte del productor y administración de Zonas Geográficas.

---

## 1. Estructura de Componentes Frontend

```text
PanelEstadistico.tsx
 └── Tabs (Resumen Ejecutivo | Zonas Geográficas | ...)
      └── GeographicZonesManager.tsx
           ├── CountrySelect.tsx (Selector de País: AR, BR, UY)
           ├── ZoneMetricsHeader.tsx (Métricas agregadas por País)
           ├── ZoneTable.tsx (Listado de zonas registradas)
           │    └── ZoneRowActions.tsx (Acciones de edición y desactivación)
           │
           └── ZoneFormModal.tsx (Modal de Crear/Editar Zona)
                ├── TerritoryTreeSelect.tsx (Selector Jerárquico Multiselección por parent_id)
                │    └── TerritoryTreeNode.tsx (Nodo expandible con Badges de estado)
                ├── ZoneConflictAlert.tsx (Alerta visual de superposición)
                └── ZoneFormSummary.tsx (Resumen de Territorios Seleccionados)
```

### Componente de Selección para Productor:
```text
ProjectForm / LocationSelector.tsx
 ├── CountrySelect (Selección de País)
 └── CascadingTerritorySelect (Selección en cascada: Provincia -> Dpto -> Localidad)
      └── Guarda geographic_territory_id en el proyecto
```

---

## 2. Componentes Principales y Flujos

### 2.1 `GeographicZonesManager.tsx`
Contenedor principal en el Panel Estadístico para los administradores.
* **Estado:** `countryId` (defecto: Argentina = 1), `zonesList`, `loading`, `isModalOpen`, `editingZone`.
* **Funcionalidad:** Permite alternar entre países, muestra la lista de zonas filtrada por `country_id` y permite abrir el modal para crear o editar zonas.

---

### 2.2 `TerritoryTreeSelect.tsx` (Tree Multi-Select)
Selector jerárquico que renderiza las divisiones territoriales obtenidas de `/territories/tree`.

#### Características:
- Permite seleccionar provincias completas, departamentos o localidades específicas.
- Muestra los estados visuales del territorio:
  - 🟢 **Disponible (`AVAILABLE`):** Casilla desmarcada, totalmente libre.
  - 🟡 **Parcialmente Asignado (`PARTIALLY_ASSIGNED`):** Badge de advertencia indicando que parte del territorio pertenece a otra zona.
  - 🔒 **Bloqueado (`BLOCKED`):** Casilla deshabilitada con un ícono de candado y tooltip indicando la zona activa propietaria.
  - 🔵 **Seleccionado (`SELECTED`):** Forma parte de la zona en configuración.
- Soporta **Selección Transprovincial** (ej. seleccionar localidades de Entre Ríos y Corrientes simultáneamente).

---

### 2.3 `LocationSelector.tsx` (Selector de Ubicación para el Productor)
Componente utilizado en la creación/edición de proyectos (`Projects.tsx`).

#### Flujo del Productor:
1. El productor selecciona el **País** (`country_id`).
2. El sistema despliega en cascada las divisiones según el nivel jerárquico (`level_number`):
   - Nivel 1: Provincia / Estado.
   - Nivel 2: Departamento / Municipio.
   - Nivel 3: Localidad (Ubicación más específica).
3. El proyecto guarda únicamente `country_id` y `geographic_territory_id`.
4. El backend resuelve y asigna automáticamente `geographic_zone_id`.

---

## 3. Servicio Frontend (`zoneService.ts`)

```typescript
import { apiFetch } from '@/lib/api';
import type { 
  Country, 
  GeographicZone, 
  CreateGeographicZoneDTO, 
  UpdateGeographicZoneDTO, 
  GeographicTerritory, 
  ConflictCheckResult,
  ZoneResolutionResult 
} from '@/types/zone';

// Obtener países
export const getCountries = async (): Promise<Country[]> => {
  return await apiFetch('/calculador-pecan/v1/countries');
};

// Obtener árbol territorial por país
export const getTerritoryTree = async (countryId: number, excludeZoneId?: number): Promise<GeographicTerritory[]> => {
  return await apiFetch('/calculador-pecan/v1/territories/tree', {
    params: { country_id: countryId, exclude_zone_id: excludeZoneId }
  });
};

// Obtener zonas geográficas
export const getZones = async (countryId?: number, isActive: boolean = true): Promise<GeographicZone[]> => {
  return await apiFetch('/calculador-pecan/v1/zones', {
    params: { country_id: countryId, is_active: isActive }
  });
};

// Validar conflictos antes de guardar
export const checkZoneConflicts = async (
  countryId: number, 
  territoryIds: number[], 
  excludeZoneId?: number
): Promise<ConflictCheckResult> => {
  return await apiFetch('/calculador-pecan/v1/zones/check-conflicts', {
    method: 'POST',
    body: JSON.stringify({ country_id: countryId, territory_ids: territoryIds, exclude_zone_id: excludeZoneId })
  });
};

// Crear zona
export const createZone = async (dto: CreateGeographicZoneDTO): Promise<GeographicZone> => {
  return await apiFetch('/calculador-pecan/v1/zones', {
    method: 'POST',
    body: JSON.stringify(dto)
  });
};

// Editar zona
export const updateZone = async (id: number, dto: UpdateGeographicZoneDTO): Promise<GeographicZone> => {
  return await apiFetch('/calculador-pecan/v1/zones/' + id, {
    method: 'PUT',
    body: JSON.stringify(dto)
  });
};

// Eliminar / Desactivar zona
export const deleteZone = async (id: number): Promise<void> => {
  await apiFetch('/calculador-pecan/v1/zones/' + id, {
    method: 'DELETE'
  });
};

// Resolver zona de un proyecto
export const resolveProjectZone = async (projectId: number): Promise<ZoneResolutionResult> => {
  return await apiFetch('/calculador-pecan/v1/zones/resolve-project', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId })
  });
};
```
