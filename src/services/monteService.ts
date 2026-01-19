/**
 * @file Service functions for interacting with the montes API.
 */

import { apiRequest } from './api';

const BASE_ENDPOINT = 'ccp/v1/montes';
const TRIAL_MONTES_KEY = 'trialMontes';

/**
 * Checks if the user is in trial mode.
 *
 * @returns True if in trial mode.
 */
const isTrialMode = (): boolean => {
	return localStorage.getItem('isTrialMode') === 'true';
};

export interface MonteDB {
  id: number;
  project_id: number;
  campaign_created_id: number;
  monte_name: string;
  area_hectareas: string;
  plantas_por_hectarea: number;
  fecha_plantacion: string | null;
  variedad?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches all montes for a given project.
 *
 * @param projectId - The ID of the project.
 * @returns A promise that resolves to an array of monte objects.
 */
export const getMontesByProject = (projectId: number): Promise<MonteDB[]> => {
  if (!projectId) {
    return Promise.reject(new Error('Project ID is required.'));
  }
  if (isTrialMode()) {
    const montes = JSON.parse(localStorage.getItem(TRIAL_MONTES_KEY) || '[]');
    const filtered = montes.filter((m: MonteDB) => m.project_id === projectId);
    return Promise.resolve(filtered);
  }
  return apiRequest(`${BASE_ENDPOINT}/by-project/${projectId}`);
};

/**
 * Creates a new monte.
 *
 * @param monteData - The data for the new monte.
 * @returns A promise that resolves to the newly created monte object.
 */
export const createMonte = (monteData: {
  project_id: number;
  monte_name?: string;
  area_hectareas?: number;
  plantas_por_hectarea?: number;
  fecha_plantacion?: string;
  variedad?: string;
}): Promise<MonteDB> => {
  if (isTrialMode()) {
    const montes = JSON.parse(localStorage.getItem(TRIAL_MONTES_KEY) || '[]');
    const newMonte: MonteDB = {
      id: Date.now(),
      project_id: monteData.project_id,
      campaign_created_id: 0, // Dummy
      monte_name: monteData.monte_name || 'Nuevo Monte',
      area_hectareas: monteData.area_hectareas?.toString() || '0',
      plantas_por_hectarea: monteData.plantas_por_hectarea || 0,
      fecha_plantacion: monteData.fecha_plantacion || null,
      variedad: monteData.variedad || '',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    montes.push(newMonte);
    localStorage.setItem(TRIAL_MONTES_KEY, JSON.stringify(montes));
    return Promise.resolve(newMonte);
  }
  return apiRequest(BASE_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(monteData),
  });
};

/**
 * Updates an existing monte.
 *
 * @param monteId - The ID of the monte to update.
 * @param updateData - The data to update.
 * @returns A promise that resolves to the updated monte object.
 */
export const updateMonte = (monteId: number, updateData: {
  monte_name?: string;
  area_hectareas?: number;
  plantas_por_hectarea?: number;
  fecha_plantacion?: string;
  variedad?: string;
}): Promise<MonteDB> => {
  if (!monteId) {
    return Promise.reject(new Error('Monte ID is required.'));
  }
  return apiRequest(`${BASE_ENDPOINT}/${monteId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
};

/**
 * Deletes a monte.
 *
 * @param monteId - The ID of the monte to delete.
 * @returns A promise that resolves when the monte is deleted.
 */
export const deleteMonte = (monteId: number): Promise<{ deleted: boolean }> => {
  if (!monteId) {
    return Promise.reject(new Error('Monte ID is required.'));
  }
  return apiRequest(`${BASE_ENDPOINT}/${monteId}`, {
    method: 'DELETE',
  });
};