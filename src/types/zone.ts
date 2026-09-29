export type TerritoryAvailabilityState =
  | 'AVAILABLE'
  | 'PARTIALLY_ASSIGNED'
  | 'FULLY_ASSIGNED'
  | 'SELECTED'
  | 'BLOCKED';

export const TerritoryAvailabilityState = {
  AVAILABLE: 'AVAILABLE' as const,
  PARTIALLY_ASSIGNED: 'PARTIALLY_ASSIGNED' as const,
  FULLY_ASSIGNED: 'FULLY_ASSIGNED' as const,
  SELECTED: 'SELECTED' as const,
  BLOCKED: 'BLOCKED' as const,
};

export type GeographicZoneStatus = 'active' | 'inactive';

export const GeographicZoneStatus = {
  ACTIVE: 'active' as const,
  INACTIVE: 'inactive' as const,
};

export interface Country {
  id: number;
  name: string;
  iso_code_2: string;
  iso_code_3: string | null;
  is_active: boolean;
  is_user_country?: boolean;
}

export interface GeographicTerritory {
  id: number;
  country_id: number;
  parent_id: number | null;
  name: string;
  normalized_name: string;
  territory_type: string;
  level_number: number;
  external_source: string | null;
  external_id: string | null;
  is_active: boolean;
  availability_state?: TerritoryAvailabilityState;
  assigned_zone_id?: number | null;
  assigned_zone_name?: string | null;
  children?: GeographicTerritory[];
}

export interface GeographicZone {
  id: number;
  country_id: number;
  country_name?: string;
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

export interface CreateGeographicZoneDTO {
  country_id?: number;
  name: string;
  description?: string;
  is_active?: boolean;
  territory_ids: number[];
}

export interface UpdateGeographicZoneDTO {
  country_id?: number;
  name?: string;
  description?: string;
  is_active?: boolean;
  territory_ids?: number[];
}

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

export interface ZoneResolutionResult {
  project_id: number;
  country_id: number;
  geographic_territory_id: number | null;
  geographic_zone_id: number | null;
  geographic_zone_name: string | null;
  resolution_status: 'ASSIGNED' | 'UNASSIGNED';
}
