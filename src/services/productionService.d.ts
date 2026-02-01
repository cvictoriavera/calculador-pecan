/**
 * Type declarations for productionService.js
 */

export declare function getProductionsByCampaign(campaignId: number): Promise<any[]>;

export declare function createProductionsByCampaign(campaignId: number, productionData: {
  project_id: number;
  productions: Array<{
    monte_id: number;
    quantity_kg: number;
    is_estimated?: number;
  }>;
  input_type: 'total' | 'detail';
}): Promise<any>;

export declare function deleteProductionsByCampaign(campaignId: number): Promise<any>;

export declare function getProductionsBatch(campaignIds: number[]): Promise<Record<number, any[]>>;