/**
 * @file Type definitions for production service functions.
 */

interface ProductionRecord {
  monte_id: number;
  quantity_kg: number;
  is_estimated?: number;
}

interface ProductionData {
  project_id: number;
  productions: ProductionRecord[];
  input_type: 'total' | 'detail';
}

interface ProductionResponse {
  success: boolean;
  productions?: unknown[];
}

declare module '@/services/productionService' {
  export function getProductionsByCampaign(campaignId: number): Promise<unknown[]>;
  export function createProductionsByCampaign(campaignId: number, productionData: ProductionData): Promise<ProductionResponse>;
  export function deleteProductionsByCampaign(campaignId: number): Promise<ProductionResponse>;
}