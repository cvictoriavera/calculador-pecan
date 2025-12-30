interface Campaign {
  id: number;
  project_id: number;
  campaign_name: string;
  year: number;
  start_date: string;
  end_date: string | null;
  status: 'open' | 'closed' | 'archived';
  is_current: number;
  notes?: string;
  average_price?: string;
  total_production?: string;
  created_at: string;
  updated_at: string;
}

interface CampaignData {
  project_id: number;
  campaign_name: string;
  year: number;
  start_date: string;
  end_date?: string;
  status?: string;
  is_current?: number;
  notes?: string;
  average_price?: number;
  total_production?: number;
}

interface CampaignUpdateData {
  campaign_name?: string;
  year?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  is_current?: number;
  notes?: string;
  average_price?: number;
  total_production?: number;
}

interface CloseActiveCampaignData {
  project_id: number;
}

interface CloseActiveCampaignResponse {
  success: boolean;
  closed: boolean;
}

declare module '@/services/campaignService' {
  export function getCampaignsByProject(projectId: number): Promise<Campaign[]>;
  export function createCampaign(campaignData: CampaignData): Promise<Campaign>;
  export function updateCampaign(campaignId: number, campaignData: CampaignUpdateData): Promise<Campaign>;
  export function closeActiveCampaign(data: CloseActiveCampaignData): Promise<CloseActiveCampaignResponse>;
}