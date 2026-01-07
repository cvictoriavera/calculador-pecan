import { create } from 'zustand';
import { useDataStore } from './dataStore';



interface CalculationsState {
  // Selectores por año (para Campanas)
  getTotalCosts: (year: number) => number;
  getTotalInvestments: (year: number) => number;

  // Selectores por campaignId (para Costos y Campanas)
  getCostByCategory: (campaignId: number | string) => Record<string, number>;
  getInvestmentByCategory: (campaignId: number | string) => Record<string, number>;
  getTotalCostsByCampaign: (campaignId: number | string) => number;
  getTotalInvestmentsByCampaign: (campaignId: number | string) => number;
  getTotalProductionByCampaign: (campaignId: number | string) => number;

  getProfitabilityRatio: (campaignId: number | string) => number;

  // Production selectors
  getTotalProduction: (year: number) => number;
  getProductionByMonte: (year: number) => Record<string, number>;
  getProductionCampaign: (year: number) => { averagePrice: number; totalProduction: number } | null;
  hasProductionForYear: (year: number) => boolean;
}

export const useCalculationsStore = create<CalculationsState>((_, get) => ({

  getTotalProductionByCampaign: (campaignId: number | string): number => {
    
    const { productions } = useDataStore.getState();
    const targetId = Number(campaignId);

    if (!targetId) return 0;

    return productions
      .filter(p => Number(p.campaign_id) === targetId) // Ojo: usa el nombre real de tu propiedad en DB
      .reduce((sum, p) => sum + (Number(p.quantity_kg) || 0), 0);
  },

  getTotalCosts: (year: number): number => {
    const { costs, campaigns } = useDataStore.getState();
    const campaign = campaigns.find(c => c.year === year);
    if (!campaign) return 0;

    return costs
      .filter(cost => cost.campaign_id === campaign.id)
      .reduce((sum, cost) => sum + (Number(cost.total_amount) || 0), 0);
  },

  getTotalInvestments: (year: number): number => {
    const { investments, campaigns } = useDataStore.getState();
    const campaign = campaigns.find(c => c.year === year);
    if (!campaign) return 0;

    return investments
      .filter(inv => inv.campaign_id === campaign.id)
      .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  },

  getCostByCategory: (campaignId: number | string): Record<string, number> => {
    const { costs } = useDataStore.getState();
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
    const { investments } = useDataStore.getState();
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
    const { costs } = useDataStore.getState();
    const targetId = Number(campaignId);

    if (!targetId) return 0;

    return costs
      .filter(cost => Number(cost.campaign_id) === targetId)
      .reduce((sum, cost) => sum + (Number(cost.total_amount) || 0), 0);
  },

  getTotalInvestmentsByCampaign:(campaignId: number | string): number => {
    const { investments } = useDataStore.getState();
    const targetId = Number(campaignId);

    if (!targetId) return 0;

    const filteredInvestments = investments.filter(inv => Number(inv.campaign_id) === targetId);
    const total = filteredInvestments.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);


    return total;
  },

  getProfitabilityRatio: (campaignId: number | string): number => {
    const totalCosts = get().getTotalCostsByCampaign(campaignId);
    const totalInvestments = get().getTotalInvestmentsByCampaign(campaignId);

    if (totalInvestments === 0) return 0;
    return (totalCosts - totalInvestments) / totalInvestments;
  },




  // Production selectors
  getTotalProduction: (year: number): number => {
    const productions = useDataStore.getState().productions
      .filter(p => p.campaign_id === year);
    return productions.reduce((sum, p) => sum + p.quantity_kg, 0);
  },

  getProductionByMonte: (year: number): Record<string, number> => {
    const productions = useDataStore.getState().productions
      .filter(p => p.campaign_id === year); // campaign_id is actually the year in this context

    return productions.reduce((acc, p) => {
      acc[p.monte_id] = (acc[p.monte_id] || 0) + p.quantity_kg;
      return acc;
    }, {} as Record<string, number>);
  },

  getProductionCampaign: (year: number) => {
    const campaign = useDataStore.getState().productionCampaigns
      .find(pc => pc.year === year);
    return campaign ? {
      averagePrice: campaign.averagePrice,
      totalProduction: campaign.totalProduction
    } : null;
  },

  hasProductionForYear: (year: number): boolean => {
    const productions = useDataStore.getState().productions
      .filter(p => p.campaign_id === year);
    return productions.length > 0;
  },
}));