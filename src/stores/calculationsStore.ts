// Calculations Store - Selectores y cálculos memoizados
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

  getProfitabilityRatio: (campaignId: number | string) => number;

  // Production selectors
  getTotalProduction: (year: number) => number;
  getProductionByMonte: (year: number) => Record<string, number>;
  getProductionCampaign: (year: number) => { averagePrice: number; totalProduction: number } | null;
  hasProductionForYear: (year: number) => boolean;
}

export const useCalculationsStore = create<CalculationsState>((_, get) => ({
  // Selectores por año
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

  // ELIMINAR memoize()
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

  // 1. Costos Totales por CAMPAÑA (ID)
  getTotalCostsByCampaign: (campaignId: number | string): number => {
    const { costs } = useDataStore.getState();
    const targetId = Number(campaignId);

    if (!targetId) return 0;

    return costs
      .filter(cost => Number(cost.campaign_id) === targetId)
      .reduce((sum, cost) => sum + (Number(cost.total_amount) || 0), 0);
  },

  // 2. Inversiones Totales por CAMPAÑA (ID)
  getTotalInvestmentsByCampaign:(campaignId: number | string): number => {
    const { investments } = useDataStore.getState();
    const targetId = Number(campaignId);

    if (!targetId) return 0;

    const filteredInvestments = investments.filter(inv => Number(inv.campaign_id) === targetId);
    const total = filteredInvestments.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);


    return total;
  },

  // Ratio de Rentabilidad (Por ID)
  getProfitabilityRatio: (campaignId: number | string): number => {
    const totalCosts = get().getTotalCostsByCampaign(campaignId);
    const totalInvestments = get().getTotalInvestmentsByCampaign(campaignId);

    if (totalInvestments === 0) return 0;
    return (totalCosts - totalInvestments) / totalInvestments;
  },
  // Production selectors
  getTotalProduction: (year: number): number => {
    const productions = useDataStore.getState().productions
      .filter(p => p.year === year);
    return productions.reduce((sum, p) => sum + p.kgHarvested, 0);
  },

  getProductionByMonte: (year: number): Record<string, number> => {
    const productions = useDataStore.getState().productions
      .filter(p => p.year === year);

    return productions.reduce((acc, p) => {
      acc[p.monteId] = (acc[p.monteId] || 0) + p.kgHarvested;
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
      .filter(p => p.year === year);
    return productions.length > 0;
  },
}));