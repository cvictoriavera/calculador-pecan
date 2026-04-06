export interface ProjectCampaignSeed {
  campaign_name: string;
  year: number;
  start_date: string;
  end_date: string;
  status: 'open' | 'closed';
  is_current: 0 | 1;
}

export const buildCampaignsFromInitialYear = (initialYear: number): ProjectCampaignSeed[] => {
  const currentYear = new Date().getFullYear();
  const safeInitialYear = Number.isFinite(initialYear)
    ? Math.min(Math.max(Math.floor(initialYear), 1900), currentYear)
    : currentYear;
  const campaigns: ProjectCampaignSeed[] = [];

  for (let year = safeInitialYear; year <= currentYear; year++) {
    campaigns.push({
      campaign_name: `Campaña ${year}`,
      year,
      start_date: `Julio ${year}`,
      end_date: `Junio ${year + 1}`,
      status: year === currentYear ? 'open' : 'closed',
      is_current: year === currentYear ? 1 : 0,
    });
  }

  return campaigns;
};
