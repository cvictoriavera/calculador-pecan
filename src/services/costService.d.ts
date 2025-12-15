/**
 * Type declarations for costService.js
 */

export declare function getCostsByCampaign(projectId: number, campaignId: number): Promise<any[]>;

export declare function createCost(costData: {
  project_id: number;
  campaign_id: number;
  category: string;
  details?: any;
  total_amount: number;
}): Promise<any>;

export declare function updateCost(costId: number, costData: {
  category?: string;
  details?: any;
  total_amount?: number;
}): Promise<any>;

export declare function deleteCost(costId: number): Promise<any>;

export declare function createCostBatch(costDataArray: Array<{
  project_id: number;
  campaign_id: number;
  category: string;
  details?: any;
  total_amount: number;
}>): Promise<any[]>;

export declare function updateCostBatch(costDataArray: Array<{
  id: number;
  category?: string;
  details?: any;
  total_amount?: number;
}>): Promise<any[]>;