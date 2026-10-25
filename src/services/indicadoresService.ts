import { apiRequest } from './api';
import type { ProductorData } from '@/data/indicadoresData';

export interface IndicadoresResponse {
  min_age: number;
  max_age: number;
  count: number;
  producers: ProductorData[];
}

/**
 * Obtener indicadores agregados de todos los productores desde la base de datos (Exclusivo Administrador).
 * @param minAge Edad mínima en años
 * @param maxAge Edad máxima en años
 */
export async function getAdminIndicadores(minAge = 9, maxAge = 11): Promise<ProductorData[]> {
  try {
    const cleanMin = Math.max(1, Math.round(minAge));
    const cleanMax = Math.max(cleanMin, Math.round(maxAge));
    const endpoint = `ccp/v1/admin/indicadores?min_age=${cleanMin}&max_age=${cleanMax}`;
    const response: IndicadoresResponse = await apiRequest(endpoint);
    return response.producers || [];
  } catch (error) {
    console.error('Error fetching admin indicadores:', error);
    throw error;
  }
}
