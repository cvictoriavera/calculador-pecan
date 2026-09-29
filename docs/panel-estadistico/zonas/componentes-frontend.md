# Especificación Técnica: Componentes Frontend (React / TS) - Gestión Geográfica y Zonas

Este documento especifica los componentes React, interfaces de usuario, estado global/local y servicios TypeScript actualizados para la gestión geográfica multi-país, selección de ubicación de proyectos por parte del productor y administración de Zonas Geográficas.

---

## 1. Estructura de Componentes Frontend

```text
ZonasGeograficas.tsx (Página dedicada en /zonas-geograficas)
 └── GeographicZonesManager.tsx
      ├── Header superior (Filtro por País para Super Admin, Badge de País del usuario, botón Actualizar)
      ├── ZoneFormCard.tsx (Formulario Inline de Creación / Edición de Zonas)
      │    ├── TerritoryTreeSelect.tsx (Selector Jerárquico Multiselección)
      │    │    ├── Resumen de Territorios Seleccionados (Caja de Cápsulas Badges con agrupación inteligente y botón X)
      │    │    ├── Buscador en Tiempo Real (Filtro insensible a tildes con auto-expansión de ramas)
      │    │    └── Árbol Interactivo (Nodos con selección en cascada y bloqueo heredado)
      │    └── ZoneConflictAlert.tsx (Alerta visual de superposición)
      └── Tabla de Zonas Registradas (ID, Nombre, Territorios, Proyectos, Productores, Hectáreas y Acciones)
```

### Componente de Selección para Productor:
```text
ProjectForm / LocationSelector.tsx
 └── CascadingTerritorySelect (Selección en cascada: Provincia -> Dpto -> Localidad)
      └── El país viene fijado e inmutable por el perfil del usuario (ACF `pais`)
      └── Guarda geographic_territory_id en el proyecto
```

---

## 2. Componentes Principales y Flujos

### 2.1 `GeographicZonesManager.tsx` y `ZoneFormCard.tsx`
Sección administrativa accesible mediante la ruta `/zonas-geograficas` desde el menú lateral del Panel Estadístico.
* **Estado:** `selectedCountryId`, `zones`, `loading`, `editingZone`.
* **Formulario Inline:** La creación y edición de zonas se realiza mediante el componente `ZoneFormCard.tsx` renderizado **directamente en pantalla arriba de la tabla de zonas registradas** (sin ventanas modales ni botones desplegables).
* **Comportamiento por Rol de Usuario:**
  * **Super Administrador (`administrator`):** Puede alternar la vista entre países registrados mediante el selector del encabezado.
  * **Admin de Cámara por País (`admin_country`):** No posee selector de país. Su país de gestión viene **fijado e inmutable** desde el campo ACF `pais` de su perfil.
* **Funcionalidad de Edición:** Al hacer clic en el botón de edición (✏️) de una fila de la tabla, la página realiza un desplazamiento suave (*smooth scroll*) al formulario superior cargando los datos de la zona para su modificación o deselección individual de territorios, con opción de *"Cancelar edición"*.

---

### 2.2 `TerritoryTreeSelect.tsx` (Selector Territorial con Búsqueda y Cápsulas)
Selector jerárquico que renderiza las divisiones territoriales obtenidas de `/territories/tree`.

#### Características:
- **Resumen de Cápsulas (`selectedCapsules`):** Muestra una caja superior con cápsulas representantes de mayor jerarquía:
  - Si se selecciona una **Provincia completa**, se muestra únicamente una cápsula con el nombre de la Provincia.
  - Si se selecciona un **Departamento**, se muestra únicamente la cápsula del Departamento.
  - Si se seleccionan **localidades individuales**, se muestran sus respectivas cápsulas con su botón `X` de deselección directa.
- **Buscador en Tiempo Real:** Filtro de texto insensible a mayúsculas/minúsculas y tildes (normalización NFD en español) que expande automáticamente las ramas del árbol que contienen coincidencias.
- **Selección en Cascada y Bloqueo Heredado:**
  - Al marcar un nodo padre (Provincia / Departamento), se marcan automáticamente todos sus territorios descendientes disponibles.
  - Si un territorio padre pertenece a otra zona activa, la propiedad `BLOCKED` se propaga recursivamente a todos sus departamentos y localidades descendientes, mostrando el badge 🔒 **Asignado a [Nombre de Zona]** y deshabilitando su selección.
- **Resolución de Selección Implícita (`isNodeSelected`):** Permite desmarcar departamentos o localidades individuales en modo edición reduciendo la cobertura sin perder el resto de los territorios seleccionados.

---

### 2.3 `LocationSelector.tsx` (Selector de Ubicación para el Productor)
Componente utilizado en la creación/edición de proyectos (`Projects.tsx`).

#### Flujo del Productor:
1. El **País** del proyecto se determina automáticamente a partir del campo inmutable ACF `pais` de la cuenta del usuario (no hay selector de país).
2. El sistema despliega en cascada las divisiones territoriales internas de su país (`level_number`):
   - Nivel 1: Provincia / Estado.
   - Nivel 2: Departamento / Municipio.
   - Nivel 3: Localidad (Ubicación más específica).
3. El proyecto guarda únicamente `country_id` y `geographic_territory_id`.
4. El backend resuelve y asigna automáticamente la `geographic_zone_id`.

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
