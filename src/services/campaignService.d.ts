interface Campaign {
  id: number;
  project_id: number;
  campaign_name: string;
  year: number;
  start_date: string;
  end_date: string | null;
  status: 'open' | 'closed' | 'archived';
  is_current: number;
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
}

declare module '@/services/campaignService' {
  export function getCampaignsByProject(projectId: number): Promise<Campaign[]>;
  export function createCampaign(campaignData: CampaignData): Promise<Campaign>;
}