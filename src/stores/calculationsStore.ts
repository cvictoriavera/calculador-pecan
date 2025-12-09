// Calculations Store - Selectores y cálculos memoizados
import { create } from 'zustand';
import { useDataStore } from './dataStore';

// Función auxiliar para memoización simple
const memoize = <TArgs extends readonly unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn
): (...args: TArgs) => TReturn => {
  const cache = new Map<string, TReturn>();
  return (...args: TArgs) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

interface CalculationsState {
  // Selectores memoizados
  getTotalCosts: (year: number) => number;
  getTotalInvestments: (year: number) => number;
  getCostByCategory: (year: number) => Record<string, number>;
  getInvestmentByCategory: (year: number) => Record<string, number>;
  getProfitabilityRatio: (year: number) => number;

  // Production selectors
  getTotalProduction: (year: number) => number;
  getProductionByMonte: (year: number) => Record<string, number>;
  getProductionCampaign: (year: number) => { averagePrice: number; totalProduction: number } | null;
  hasProductionForYear: (year: number) => boolean;
}

export const useCalculationsStore = create<CalculationsState>((_, get) => ({
  // Selector para costos totales por año
  getTotalCosts: memoize((year: number): number => {
    const costs = useDataStore.getState().costs
      .filter(c => c.year === year);
    return costs.reduce((sum, cost) => sum + cost.amount, 0);
  }),

  // Selector para inversiones totales por año
  getTotalInvestments: memoize((year: number): number => {
    const investments = useDataStore.getState().investments
      .filter(i => i.year === year);
    return investments.reduce((sum, inv) => sum + inv.amount, 0);
  }),

  // Selector para costos por categoría
  getCostByCategory: memoize((year: number): Record<string, number> => {
    const costs = useDataStore.getState().costs
      .filter(c => c.year === year);

    return costs.reduce((acc, cost) => {
      acc[cost.category] = (acc[cost.category] || 0) + cost.amount;
      return acc;
    }, {} as Record<string, number>);
  }),

  // Selector para inversiones por categoría
  getInvestmentByCategory: memoize((year: number): Record<string, number> => {
    const investments = useDataStore.getState().investments
      .filter(i => i.year === year);

    return investments.reduce((acc, inv) => {
      acc[inv.category] = (acc[inv.category] || 0) + inv.amount;
      return acc;
    }, {} as Record<string, number>);
  }),

  // Selector para ratio de rentabilidad
  getProfitabilityRatio: memoize((year: number): number => {
    const totalCosts = get().getTotalCosts(year);
    const totalInvestments = get().getTotalInvestments(year);

    if (totalInvestments === 0) return 0;
    return (totalCosts - totalInvestments) / totalInvestments;
  }),

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