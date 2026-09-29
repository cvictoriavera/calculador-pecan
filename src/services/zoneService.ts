import { apiRequest } from '@/services/api';
import type {
  Country,
  GeographicTerritory,
  GeographicZone,
  CreateGeographicZoneDTO,
  UpdateGeographicZoneDTO,
  ConflictCheckResult,
  ZoneResolutionResult
} from '@/types/zone';

export const getCountries = async (): Promise<Country[]> => {
  const res = await apiRequest('ccp/v1/countries');
  return res?.data || [];
};

export const getTerritories = async (params?: {
  country_id?: number;
  parent_id?: number | null;
  level_number?: number;
}): Promise<GeographicTerritory[]> => {
  const query = new URLSearchParams();
  if (params?.country_id) query.append('country_id', String(params.country_id));
  if (params?.parent_id !== undefined) {
    query.append('parent_id', params.parent_id === null ? 'null' : String(params.parent_id));
  }
  if (params?.level_number) query.append('level_number', String(params.level_number));

  const url = `ccp/v1/territories${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await apiRequest(url);
  return res?.data || [];
};

export const getTerritoryTree = async (
  countryId?: number,
  excludeZoneId?: number
): Promise<GeographicTerritory[]> => {
  const query = new URLSearchParams();
  if (countryId) query.append('country_id', String(countryId));
  if (excludeZoneId) query.append('exclude_zone_id', String(excludeZoneId));

  const url = `ccp/v1/territories/tree${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await apiRequest(url);
  return res?.data || [];
};

export const getZones = async (countryId?: number): Promise<GeographicZone[]> => {
  const query = new URLSearchParams();
  if (countryId) query.append('country_id', String(countryId));

  const url = `ccp/v1/zones${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await apiRequest(url);
  return res?.data || [];
};

export const getZoneById = async (id: number): Promise<GeographicZone> => {
  const res = await apiRequest(`ccp/v1/zones/${id}`);
  return res?.data;
};

export const checkZoneConflicts = async (
  countryId: number,
  territoryIds: number[],
  excludeZoneId?: number
): Promise<ConflictCheckResult> => {
  const res = await apiRequest('ccp/v1/zones/check-conflicts', {
    method: 'POST',
    body: JSON.stringify({
      country_id: countryId,
      territory_ids: territoryIds,
      exclude_zone_id: excludeZoneId
    })
  });
  return res?.data;
};

export const createZone = async (dto: CreateGeographicZoneDTO): Promise<GeographicZone> => {
  const res = await apiRequest('ccp/v1/zones', {
    method: 'POST',
    body: JSON.stringify(dto)
  });
  return res?.data;
};

export const updateZone = async (id: number, dto: UpdateGeographicZoneDTO): Promise<GeographicZone> => {
  const res = await apiRequest(`ccp/v1/zones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto)
  });
  return res?.data;
};

export const deleteZone = async (id: number): Promise<void> => {
  await apiRequest(`ccp/v1/zones/${id}`, {
    method: 'DELETE'
  });
};

export const resolveProjectZone = async (projectId: number): Promise<ZoneResolutionResult> => {
  const res = await apiRequest('ccp/v1/zones/resolve-project', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId })
  });
  return res?.data;
};
