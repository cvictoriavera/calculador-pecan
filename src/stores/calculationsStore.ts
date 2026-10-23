import { useMemo } from 'react';
import { useDataStore } from './dataStore';

export const useCalculationsStore = () => {
  const costs = useDataStore(state => state.costs);
  const investments = useDataStore(state => state.investments);
  const productions = useDataStore(state => state.productions);
  const campaigns = useDataStore(state => state.campaigns);
  const productionCampaigns = useDataStore(state => state.productionCampaigns);

  return useMemo(() => ({
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

    getCostPerHaByCategory: (campaignId: number | string, totalPlantedArea: number): Record<string, number> => {
      const targetId = Number(campaignId);
      if (!totalPlantedArea || totalPlantedArea <= 0) return {};
      const costsByCategory = costs
        .filter(cost => Number(cost.campaign_id) === targetId)
        .reduce((acc, cost) => {
          const amount = Number(cost.total_amount) || 0;
          acc[cost.category] = (acc[cost.category] || 0) + amount;
          return acc;
        }, {} as Record<string, number>);

      return Object.fromEntries(
        Object.entries(costsByCategory).map(([cat, amount]) => [cat, amount / totalPlantedArea])
      );
    },

    getCostPerKgByCategory: (campaignId: number | string, totalProductionKg?: number): Record<string, number> => {
      const targetId = Number(campaignId);
      const totalProduction = totalProductionKg !== undefined
        ? totalProductionKg
        : productions
            .filter(p => Number(p.campaign_id) === targetId)
            .reduce((sum, p) => sum + (Number(p.quantity_kg) || 0), 0);

      if (!totalProduction || totalProduction <= 0) return {};

      const costsByCategory = costs
        .filter(cost => Number(cost.campaign_id) === targetId)
        .reduce((acc, cost) => {
          const amount = Number(cost.total_amount) || 0;
          acc[cost.category] = (acc[cost.category] || 0) + amount;
          return acc;
        }, {} as Record<string, number>);

      return Object.fromEntries(
        Object.entries(costsByCategory).map(([cat, amount]) => [cat, amount / totalProduction])
      );
    },

    getCostPerHaByRubro: (campaignId: number | string, category: string, totalPlantedArea: number): number => {
      if (!totalPlantedArea || totalPlantedArea <= 0) return 0;
      const targetId = Number(campaignId);
      const categoryCost = costs
        .filter(cost => Number(cost.campaign_id) === targetId && cost.category === category)
        .reduce((sum, cost) => sum + (Number(cost.total_amount) || 0), 0);
      return categoryCost / totalPlantedArea;
    },

    getCostPerKgByRubro: (campaignId: number | string, category: string, totalProductionKg?: number): number => {
      const targetId = Number(campaignId);
      const totalProduction = totalProductionKg !== undefined
        ? totalProductionKg
        : productions
            .filter(p => Number(p.campaign_id) === targetId)
            .reduce((sum, p) => sum + (Number(p.quantity_kg) || 0), 0);

      if (!totalProduction || totalProduction <= 0) return 0;

      const categoryCost = costs
        .filter(cost => Number(cost.campaign_id) === targetId && cost.category === category)
        .reduce((sum, cost) => sum + (Number(cost.total_amount) || 0), 0);

      return categoryCost / totalProduction;
    },

    getInsumosBreakdown: (campaignId: number | string): Record<string, number> => {
      const targetId = Number(campaignId);
      if (!targetId) return {};

      const insumosCosts = costs.filter(
        cost => Number(cost.campaign_id) === targetId && cost.category === 'insumos'
      );

      const totals: Record<string, number> = {
        'fertilizantes-suelo': 0,
        'fertilizantes-foliares': 0,
        'fungicidas': 0,
        'herbicidas': 0,
        'insecticidas': 0,
        'otros': 0,
      };

      const normalizeType = (typeName?: string): string => {
        if (!typeName) return 'otros';
        const lower = typeName.toLowerCase().trim();
        if (lower.includes('suelo')) return 'fertilizantes-suelo';
        if (lower.includes('foliar') || lower.includes('foliares')) return 'fertilizantes-foliares';
        if (lower.includes('fungicid')) return 'fungicidas';
        if (lower.includes('herbicid')) return 'herbicidas';
        if (lower.includes('insecticid')) return 'insecticidas';
        return 'otros';
      };

      insumosCosts.forEach(cost => {
        const details = cost.details;
        if (details?.quickMode && details?.subtotals) {
          Object.entries(details.subtotals).forEach(([key, val]) => {
            const normalizedKey = normalizeType(key);
            totals[normalizedKey] = (totals[normalizedKey] || 0) + (Number(val) || 0);
          });
        } else if (details?.type) {
          const key = normalizeType(details.type);
          totals[key] = (totals[key] || 0) + (Number(cost.total_amount) || 0);
        } else if (Array.isArray(details?.items) && details.items.length > 0) {
          const key = normalizeType(details.type);
          totals[key] = (totals[key] || 0) + (Number(cost.total_amount) || 0);
        } else {
          totals['otros'] = (totals['otros'] || 0) + (Number(cost.total_amount) || 0);
        }
      });

      return totals;
    },

    getInsumosCostPerHa: (campaignId: number | string, totalPlantedArea: number): Record<string, number> => {
      const targetId = Number(campaignId);
      if (!targetId || !totalPlantedArea || totalPlantedArea <= 0) return {};

      const insumosCosts = costs.filter(
        cost => Number(cost.campaign_id) === targetId && cost.category === 'insumos'
      );

      const totals: Record<string, number> = {
        'fertilizantes-suelo': 0,
        'fertilizantes-foliares': 0,
        'fungicidas': 0,
        'herbicidas': 0,
        'insecticidas': 0,
        'otros': 0,
      };

      const normalizeType = (typeName?: string): string => {
        if (!typeName) return 'otros';
        const lower = typeName.toLowerCase().trim();
        if (lower.includes('suelo')) return 'fertilizantes-suelo';
        if (lower.includes('foliar') || lower.includes('foliares')) return 'fertilizantes-foliares';
        if (lower.includes('fungicid')) return 'fungicidas';
        if (lower.includes('herbicid')) return 'herbicidas';
        if (lower.includes('insecticid')) return 'insecticidas';
        return 'otros';
      };

      insumosCosts.forEach(cost => {
        const details = cost.details;
        if (details?.quickMode && details?.subtotals) {
          Object.entries(details.subtotals).forEach(([key, val]) => {
            const normalizedKey = normalizeType(key);
            totals[normalizedKey] = (totals[normalizedKey] || 0) + (Number(val) || 0);
          });
        } else if (details?.type) {
          const key = normalizeType(details.type);
          totals[key] = (totals[key] || 0) + (Number(cost.total_amount) || 0);
        } else {
          totals['otros'] = (totals['otros'] || 0) + (Number(cost.total_amount) || 0);
        }
      });

      return Object.fromEntries(
        Object.entries(totals).map(([key, val]) => [key, val / totalPlantedArea])
      );
    },

    getInsumosCostPerKg: (campaignId: number | string, totalProductionKg?: number): Record<string, number> => {
      const targetId = Number(campaignId);
      if (!targetId) return {};

      const totalProduction = totalProductionKg !== undefined
        ? totalProductionKg
        : productions
            .filter(p => Number(p.campaign_id) === targetId)
            .reduce((sum, p) => sum + (Number(p.quantity_kg) || 0), 0);

      if (!totalProduction || totalProduction <= 0) return {};

      const insumosCosts = costs.filter(
        cost => Number(cost.campaign_id) === targetId && cost.category === 'insumos'
      );

      const totals: Record<string, number> = {
        'fertilizantes-suelo': 0,
        'fertilizantes-foliares': 0,
        'fungicidas': 0,
        'herbicidas': 0,
        'insecticidas': 0,
        'otros': 0,
      };

      const normalizeType = (typeName?: string): string => {
        if (!typeName) return 'otros';
        const lower = typeName.toLowerCase().trim();
        if (lower.includes('suelo')) return 'fertilizantes-suelo';
        if (lower.includes('foliar') || lower.includes('foliares')) return 'fertilizantes-foliares';
        if (lower.includes('fungicid')) return 'fungicidas';
        if (lower.includes('herbicid')) return 'herbicidas';
        if (lower.includes('insecticid')) return 'insecticidas';
        return 'otros';
      };

      insumosCosts.forEach(cost => {
        const details = cost.details;
        if (details?.quickMode && details?.subtotals) {
          Object.entries(details.subtotals).forEach(([key, val]) => {
            const normalizedKey = normalizeType(key);
            totals[normalizedKey] = (totals[normalizedKey] || 0) + (Number(val) || 0);
          });
        } else if (details?.type) {
          const key = normalizeType(details.type);
          totals[key] = (totals[key] || 0) + (Number(cost.total_amount) || 0);
        } else {
          totals['otros'] = (totals['otros'] || 0) + (Number(cost.total_amount) || 0);
        }
      });

      return Object.fromEntries(
        Object.entries(totals).map(([key, val]) => [key, val / totalProduction])
      );
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
    },

    calculateVariation: (currentVal: number, prevVal: number): { diff: number; percentage: number | null } => {
      const diff = currentVal - prevVal;
      if (prevVal === 0) {
        return {
          diff,
          percentage: currentVal > 0 ? 100 : 0,
        };
      }
      const percentage = ((currentVal - prevVal) / Math.abs(prevVal)) * 100;
      return { diff, percentage };
    },

    getTotalCostsVariation: (
      currentCampaignId: number | string,
      prevCampaignId?: number | string | null
    ): { current: number; previous: number; diff: number; percentage: number | null } => {
      const curId = Number(currentCampaignId);
      const current = curId
        ? costs.filter(c => Number(c.campaign_id) === curId).reduce((s, c) => s + (Number(c.total_amount) || 0), 0)
        : 0;

      const pId = prevCampaignId ? Number(prevCampaignId) : null;
      if (!pId) {
        return { current, previous: 0, diff: current, percentage: null };
      }

      const previous = costs
        .filter(c => Number(c.campaign_id) === pId)
        .reduce((s, c) => s + (Number(c.total_amount) || 0), 0);

      const diff = current - previous;
      const percentage = previous > 0 ? (diff / previous) * 100 : null;

      return { current, previous, diff, percentage };
    },

    getCostPerHaVariation: (
      currentCampaignId: number | string,
      prevCampaignId: number | string | null | undefined,
      currentArea: number,
      prevArea: number
    ): { current: number; previous: number; diff: number; percentage: number | null } => {
      const curId = Number(currentCampaignId);
      const curCost = curId
        ? costs.filter(c => Number(c.campaign_id) === curId).reduce((s, c) => s + (Number(c.total_amount) || 0), 0)
        : 0;
      const current = currentArea > 0 ? curCost / currentArea : 0;

      const pId = prevCampaignId ? Number(prevCampaignId) : null;
      if (!pId || prevArea <= 0) {
        return { current, previous: 0, diff: current, percentage: null };
      }

      const prevCost = costs
        .filter(c => Number(c.campaign_id) === pId)
        .reduce((s, c) => s + (Number(c.total_amount) || 0), 0);
      const previous = prevArea > 0 ? prevCost / prevArea : 0;

      const diff = current - previous;
      const percentage = previous > 0 ? (diff / previous) * 100 : null;

      return { current, previous, diff, percentage };
    },

    getCostPerKgVariation: (
      currentCampaignId: number | string,
      prevCampaignId?: number | string | null
    ): { current: number; previous: number; diff: number; percentage: number | null } => {
      const curId = Number(currentCampaignId);
      const curCost = curId
        ? costs.filter(c => Number(c.campaign_id) === curId).reduce((s, c) => s + (Number(c.total_amount) || 0), 0)
        : 0;
      const curKilos = curId
        ? productions.filter(p => Number(p.campaign_id) === curId).reduce((s, p) => s + (Number(p.quantity_kg) || 0), 0)
        : 0;
      const current = curKilos > 0 ? curCost / curKilos : 0;

      const pId = prevCampaignId ? Number(prevCampaignId) : null;
      if (!pId) {
        return { current, previous: 0, diff: current, percentage: null };
      }

      const prevCost = costs
        .filter(c => Number(c.campaign_id) === pId)
        .reduce((s, c) => s + (Number(c.total_amount) || 0), 0);
      const prevKilos = productions
        .filter(p => Number(p.campaign_id) === pId)
        .reduce((s, p) => s + (Number(p.quantity_kg) || 0), 0);
      const previous = prevKilos > 0 ? prevCost / prevKilos : 0;

      const diff = current - previous;
      const percentage = previous > 0 ? (diff / previous) * 100 : null;

      return { current, previous, diff, percentage };
    },

    getTotalProductionVariation: (
      currentCampaignId: number | string,
      prevCampaignId?: number | string | null
    ): { current: number; previous: number; diff: number; percentage: number | null } => {
      const curId = Number(currentCampaignId);
      const current = curId
        ? productions.filter(p => Number(p.campaign_id) === curId).reduce((s, p) => s + (Number(p.quantity_kg) || 0), 0)
        : 0;

      const pId = prevCampaignId ? Number(prevCampaignId) : null;
      if (!pId) {
        return { current, previous: 0, diff: current, percentage: null };
      }

      const previous = productions
        .filter(p => Number(p.campaign_id) === pId)
        .reduce((s, p) => s + (Number(p.quantity_kg) || 0), 0);

      const diff = current - previous;
      const percentage = previous > 0 ? (diff / previous) * 100 : null;

      return { current, previous, diff, percentage };
    },

    getProductionPerHaVariation: (
      currentCampaignId: number | string,
      prevCampaignId: number | string | null | undefined,
      currentArea: number,
      prevArea: number
    ): { current: number; previous: number; diff: number; percentage: number | null } => {
      const curId = Number(currentCampaignId);
      const curKilos = curId
        ? productions.filter(p => Number(p.campaign_id) === curId).reduce((s, p) => s + (Number(p.quantity_kg) || 0), 0)
        : 0;
      const current = currentArea > 0 ? curKilos / currentArea : 0;

      const pId = prevCampaignId ? Number(prevCampaignId) : null;
      if (!pId || prevArea <= 0) {
        return { current, previous: 0, diff: current, percentage: null };
      }

      const prevKilos = productions
        .filter(p => Number(p.campaign_id) === pId)
        .reduce((s, p) => s + (Number(p.quantity_kg) || 0), 0);
      const previous = prevArea > 0 ? prevKilos / prevArea : 0;

      const diff = current - previous;
      const percentage = previous > 0 ? (diff / previous) * 100 : null;

      return { current, previous, diff, percentage };
    }
  }), [costs, investments, productions, campaigns, productionCampaigns]);
};