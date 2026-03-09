import { useDataStore } from './dataStore';

export const useCalculationsStore = () => {
  const costs = useDataStore(state => state.costs);
  const investments = useDataStore(state => state.investments);
  const productions = useDataStore(state => state.productions);
  const campaigns = useDataStore(state => state.campaigns);
  const productionCampaigns = useDataStore(state => state.productionCampaigns);

  return {
    getTotalProductionByCampaign: (campaignId: number | string): number => {
      const targetId = Number(campaignId);
      if (!targetId) return 0;
      return productions
        .filter(p => Number(p.campaign_id) === targetId)
        .reduce((sum, p) => sum + (Number(p.quantity_kg) || 0), 0);
    },

    getTotalCosts: (year: number): number => {
      const campaign = campaigns.find(c => c.year === year);
      if (!campaign) return 0;
      return costs
        .filter(cost => cost.campaign_id === campaign.id)
        .reduce((sum, cost) => sum + (Number(cost.total_amount) || 0), 0);
    },

    getTotalInvestments: (year: number): number => {
      const campaign = campaigns.find(c => c.year === year);
      if (!campaign) return 0;
      return investments
        .filter(inv => inv.campaign_id === campaign.id)
        .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    },

    getCostByCategory: (campaignId: number | string): Record<string, number> => {
      const targetId = Number(campaignId);
      return costs
        .filter(cost => Number(cost.campaign_id) === targetId)
        .reduce((acc, cost) => {
          const amount = Number(cost.total_amount) || 0;
          acc[cost.category] = (acc[cost.category] || 0) + amount;
          return acc;
        }, {} as Record<string, number>);
    },

    getInvestmentByCategory: (campaignId: number | string): Record<string, number> => {
      const targetId = Number(campaignId);
      return investments
        .filter(inv => inv.campaign_id === targetId)
        .reduce((acc, inv) => {
          const amount = Number(inv.amount) || 0;
          acc[inv.category] = (acc[inv.category] || 0) + amount;
          return acc;
        }, {} as Record<string, number>);
    },

    getTotalCostsByCampaign: (campaignId: number | string): number => {
      const targetId = Number(campaignId);
      if (!targetId) return 0;
      return costs
        .filter(cost => Number(cost.campaign_id) === targetId)
        .reduce((sum, cost) => sum + (Number(cost.total_amount) || 0), 0);
    },

    getTotalInvestmentsByCampaign: (campaignId: number | string): number => {
      const targetId = Number(campaignId);
      if (!targetId) return 0;
      const filteredInvestments = investments.filter(inv => Number(inv.campaign_id) === targetId);
      return filteredInvestments.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    },

    getTotalPlantedArea: (_year: number): number => {
      return 0;
    },

    getProfitabilityRatio: (campaignId: number | string): number => {
      const targetId = Number(campaignId);
      if (!targetId) return 0;

      const totalCosts = costs
        .filter(cost => Number(cost.campaign_id) === targetId)
        .reduce((sum, cost) => sum + (Number(cost.total_amount) || 0), 0);

      const totalInvestments = investments
        .filter(inv => Number(inv.campaign_id) === targetId)
        .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

      if (totalInvestments === 0) return 0;
      return (totalCosts - totalInvestments) / totalInvestments;
    },

    getTotalProduction: (year: number): number => {
      return productions
        .filter(p => p.campaign_id === year)
        .reduce((sum, p) => sum + p.quantity_kg, 0);
    },

    getProductionByMonte: (year: number): Record<string, number> => {
      return productions
        .filter(p => p.campaign_id === year)
        .reduce((acc, p) => {
          acc[p.monte_id] = (acc[p.monte_id] || 0) + p.quantity_kg;
          return acc;
        }, {} as Record<string, number>);
    },

    getProductionCampaign: (year: number) => {
      const campaign = productionCampaigns.find(pc => pc.year === year);
      return campaign ? {
        averagePrice: campaign.averagePrice,
        totalProduction: campaign.totalProduction
      } : null;
    },

    hasProductionForYear: (year: number): boolean => {
      return productions.some(p => p.campaign_id === year);
    }
  };
};