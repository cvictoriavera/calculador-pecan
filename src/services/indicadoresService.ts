import { apiRequest } from './api';
import type { ProductorData } from '@/types/indicadores';

export interface IndicadoresResponse {
  min_age: number;
  max_age: number;
  count: number;
  producers: ProductorData[];
}

export interface BenchmarkResponse {
  min_age: number;
  max_age: number;
  producers_count: number;
  total_has: number;
  is_fallback: boolean;
  benchmark: {
    label: string;
    description: string;
    kilosPorHa: number;
    totalCostosHa: number;
    totalCostosKg: number;
    byCategoryHa: Record<string, number>;
    byCategoryKg: Record<string, number>;
  };
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

/**
 * Obtener la media consolidada de productores desde la base de datos para la pestaña Comparaciones.
 * @param minAge Edad mínima en años
 * @param maxAge Edad máxima en años
 */
export async function getBenchmarkIndicadores(minAge = 9, maxAge = 11): Promise<BenchmarkResponse> {
  try {
    const cleanMin = Math.max(1, Math.round(minAge));
    const cleanMax = Math.max(cleanMin, Math.round(maxAge));
    const endpoint = `ccp/v1/indicadores/benchmark?min_age=${cleanMin}&max_age=${cleanMax}`;
    const response: BenchmarkResponse = await apiRequest(endpoint);
    return response;
  } catch (error) {
    console.error('Error fetching benchmark indicadores:', error);
    throw error;
  }
}
