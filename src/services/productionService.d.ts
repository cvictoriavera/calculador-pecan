/**
 * @file Type definitions for production service functions.
 */

interface ProductionRecord {
  id: number; 
  project_id: number;
  campaign_id: number; 
  monte_id: number;    
  entry_group_id: string; 
  quantity_kg: number;
  is_estimated: boolean; 
  date: string; 
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