/**
 * @file TypeScript definitions for investment service functions.
 */

export interface Investment {
	id: number;
	project_id: number;
	campaign_id?: number;
	category: string;
	description: string;
	total_value: number;
	details?: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

export declare function getInvestmentsByProject(projectId: number): Promise<Investment[]>;

export declare function getInvestmentsByCampaign(projectId: number, campaignId: number): Promise<Investment[]>;

export declare function getInvestmentsBatch(projectId: number, campaignIds: number[]): Promise<Record<number, Investment[]>>;

export declare function createInvestment(investmentData: {
	project_id: number;
	campaign_id?: number;
	category: string;
	description: string;
	total_value?: number;
	details?: Record<string, unknown>;
}): Promise<{ success: boolean; id: number }>;

export declare function updateInvestment(
	investmentId: number,
	investmentData: {
		category?: string;
		description?: string;
		total_value?: number;
		details?: Record<string, unknown>;
	}
): Promise<{ success: boolean }>;

export declare function deleteInvestment(investmentId: number): Promise<{ success: boolean }>;