/**
 * @file Service functions for interacting with statistical and benchmarking API endpoints.
 */

import { apiRequest } from './api';

export interface RegionalStat {
  region: string;
  hectareas: number;
  productores: number;
  rendimiento: number;
}

export interface RubroMayorPeso {
  name: string;
  porcentaje: number;
}

export interface ResumenKPIs {
  rubroMayorPeso: RubroMayorPeso;
  costoProductivoPromedio: number;
  costoPorHaPromedio: number;
  productoresActivos: number;
}

export interface ResumenTendenciaData {
  name: string;
  produccion: number;
  precio: number;
}

export interface CostRankingItem {
  rank: number;
  name: string;
  porcentaje: number;
  color: string;
}

export interface ResumenStatsResponse {
  kpis: ResumenKPIs;
  resumenData: ResumenTendenciaData[];
  rankingCostos: CostRankingItem[];
}

/**
 * Fetches regional statistics aggregated from active projects, montes, and campaigns.
 *
 * @returns A promise that resolves to an array of regional stat objects.
 */
export const getRegionalStats = (): Promise<RegionalStat[]> => {
  return apiRequest('ccp/v1/stats/regional');
};

/**
 * Fetches executive summary statistics (KPIs, production trends, cost ranking).
 *
 * @returns A promise that resolves to ResumenStatsResponse object.
 */
export const getResumenStats = (): Promise<ResumenStatsResponse> => {
  return apiRequest('ccp/v1/stats/resumen');
};
