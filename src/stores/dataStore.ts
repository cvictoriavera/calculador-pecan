// Data Store - Datos principales de la aplicación
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getCostsByCampaign, createCost, createCostBatch, updateCost as updateCostApi, deleteCost as deleteCostApi } from '../services/costService';
import { getInvestmentsByCampaign } from '../services/investmentService';
import { getProductionsByCampaign, createProductionsByCampaign } from '../services/productionService';

// Interfaces base
export interface Project {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface Campaign {
  id: number;
  projectId: number;
  year: number;
  name: string;
  description?: string;
  average_price?: number;
}

export interface CostRecord {
   id: number;
   project_id: number;
   campaign_id: number;
   category: string;
   details?: any;
   total_amount: number;
   created_at: string;
   updated_at: string;
}

export interface InvestmentRecord {
  id: string;
  campaign_id: number;
  category: string;
  description: string;
  amount: number;
  date: Date;
  data?: any;
}

export interface ProductionCampaign {
  id: string;
  year: number;
  averagePrice: number;
  totalProduction: number;
  date: Date;
}

export interface ProductionRecord {
   id: number;
   project_id: number;
   campaign_id: number;
   monte_id: number;
   entry_group_id: string;
   quantity_kg: number;
   is_estimated: boolean;
   date: string;
 }

export interface Monte {
   id: string;
   nombre: string;
   hectareas: number;
   densidad: number;
   añoPlantacion: number;
   variedad?: string;
 }


export interface DataBackup {
  version: string;
  timestamp: string;
  data: {
    projects: Project[];
    campaigns: Campaign[];
    costs: CostRecord[];
    investments: InvestmentRecord[];
    productions: ProductionRecord[];
    productionCampaigns: ProductionCampaign[];
  };
}

interface DataState {
  // Datos
  projects: Project[];
  campaigns: Campaign[];
  costs: CostRecord[];
  investments: InvestmentRecord[];
  productions: ProductionRecord[];
  productionCampaigns: ProductionCampaign[];
  
  // Acciones
  addProject: (project: Project) => void;
  updateProject: (id: number, updates: Partial<Project>) => void;
  deleteProject: (id: number) => void;

  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: number, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: number) => void;

  loadCosts: (projectId: number, campaignId: number) => Promise<void>;
  loadAllCosts: (projectId: number, campaigns: Campaign[]) => Promise<void>;
  loadAllInvestments: (projectId: number, campaigns: Campaign[]) => Promise<void>;
  addCost: (costData: { project_id: number; campaign_id: number; category: string; details?: any; total_amount: number }) => Promise<void>;
  addCostBatch: (costDataArray: Array<{ project_id: number; campaign_id: number; category: string; details?: any; total_amount: number }>) => Promise<void>;
  updateCost: (id: number, updates: { category?: string; details?: any; total_amount?: number }) => Promise<void>;
  deleteCost: (id: number) => Promise<void>;

  addInvestment: (investment: InvestmentRecord) => void;
  updateInvestment: (id: string, updates: Partial<InvestmentRecord>) => void;
  deleteInvestment: (id: string) => void;

  loadProductions: (campaignId: number) => Promise<void>;
  addProductionBatch: (data: any) => Promise<void>;
  loadAllProductions: (campaigns: any[]) => Promise<void>;
  getTotalProductionByCampaign: (campaignId: number | string) => number;

  addProduction: (production: ProductionRecord) => void;
  updateProduction: (id: number, updates: Partial<ProductionRecord>) => void;
  deleteProduction: (id: number) => void;

  addProductionCampaign: (productionCampaign: ProductionCampaign) => void;
  updateProductionCampaign: (id: string, updates: Partial<ProductionCampaign>) => void;
  deleteProductionCampaign: (id: string) => void;


  // Backup/Restore
  createBackup: () => DataBackup;
  restoreFromBackup: (backup: DataBackup) => void;
  clearAllData: () => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
  // Estado inicial
  projects: [],
  campaigns: [],
  costs: [],
  investments: [],
  productions: [],
  productionCampaigns: [],

  // Project actions
  addProject: (project) => {
    // Validación: ID único
    if (get().projects.some((p: Project) => p.id === project.id)) {
      throw new Error(`Project with ID ${project.id} already exists`);
    }
    // Validación: Nombre requerido
    if (!project.name?.trim()) {
      throw new Error('Project name is required');
    }

    set((state) => ({ projects: [...state.projects, project] }));
  },

  updateProject: (id: number, updates) => {
    const currentProject = get().projects.find((p: Project) => p.id === id);
    if (!currentProject) {
      throw new Error(`Project with ID ${id} not found`);
    }

    // Validación: Nombre requerido si se actualiza
    if (updates.name !== undefined && !updates.name?.trim()) {
      throw new Error('Project name cannot be empty');
    }

    set((state) => ({
      projects: state.projects.map((p: Project) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },

  deleteProject: (id: number) => {
    const project = get().projects.find((p: Project) => p.id === id);
    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }

    // Validación: No eliminar si tiene campaigns
    const hasCampaigns = get().campaigns.some((c: Campaign) => c.projectId === id);
    if (hasCampaigns) {
      throw new Error('Cannot delete project with existing campaigns');
    }

    set((state) => ({
      projects: state.projects.filter((p: Project) => p.id !== id),
    }));
  },

  // Campaign actions
  addCampaign: (campaign) => {
    // Validación: Project existe
    const projectExists = get().projects.some((p: Project) => p.id === campaign.projectId);
    if (!projectExists) {
      throw new Error(`Project with ID ${campaign.projectId} does not exist`);
    }

    // Validación: ID único
    if (get().campaigns.some((c: Campaign) => c.id === campaign.id)) {
      throw new Error(`Campaign with ID ${campaign.id} already exists`);
    }

    // Validación: Nombre requerido
    if (!campaign.name?.trim()) {
      throw new Error('Campaign name is required');
    }

    set((state) => ({ campaigns: [...state.campaigns, campaign] }));
  },

  updateCampaign: (id: number, updates) => {
    const currentCampaign = get().campaigns.find((c: Campaign) => c.id === id);
    if (!currentCampaign) {
      throw new Error(`Campaign with ID ${id} not found`);
    }

    // Validación: Project existe si se cambia
    if (updates.projectId) {
      const projectExists = get().projects.some((p: Project) => p.id === updates.projectId);
      if (!projectExists) {
        throw new Error(`Project with ID ${updates.projectId} does not exist`);
      }
    }

    set((state) => ({
      campaigns: state.campaigns.map((c: Campaign) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  deleteCampaign: (id: number) => {
    const campaign = get().campaigns.find((c: Campaign) => c.id === id);
    if (!campaign) {
      throw new Error(`Campaign with ID ${id} not found`);
    }

    set((state) => ({
      campaigns: state.campaigns.filter((c: Campaign) => c.id !== id),
    }));
  },

  loadCosts: async (projectId, campaignId) => {
    try {
      const costs = await getCostsByCampaign(projectId, campaignId);
      set({ costs });
    } catch (error) {
      console.error('Error loading costs:', error);
      throw error;
    }
  },

  loadAllCosts: async (projectId, campaigns) => {
    try {
      const allCosts: CostRecord[] = [];
      for (const campaign of campaigns) {
        try {
          const campaignCosts = await getCostsByCampaign(projectId, campaign.id);
          allCosts.push(...campaignCosts);
        } catch (error) {
          console.error(`Error loading costs for campaign ${campaign.id}:`, error);
          // Continue with other campaigns instead of failing completely
        }
      }
      set({ costs: allCosts });
    } catch (error) {
      console.error('Error loading all costs:', error);
      throw error;
    }
  },

  loadAllInvestments: async (projectId, campaigns) => {
    try {
      const allInvestments: InvestmentRecord[] = [];
      for (const campaign of campaigns) {
        try {
          const campaignInvestments = await getInvestmentsByCampaign(projectId, campaign.id);
          const formattedInvestments = campaignInvestments.map(inv => ({
            id: inv.id.toString(),
            campaign_id: campaign.id,
            category: inv.category,
            description: inv.description,
            amount: Number(inv.total_value) || 0,
            date: new Date(inv.created_at),
            data: inv.details,
          }));
          allInvestments.push(...formattedInvestments);
        } catch (error) {
          console.error(`Error loading investments for campaign ${campaign.id}:`, error);
          // Continue with other campaigns instead of failing completely
        }
      }
      set({ investments: allInvestments });
    } catch (error) {
      console.error('Error loading all investments:', error);
      throw error;
    }
  },

  addCost: async (costData) => {
    try {
      await createCost({
        project_id: costData.project_id,
        campaign_id: costData.campaign_id,
        category: costData.category,
        details: costData.details,
        total_amount: costData.total_amount,
      });

      // Reload costs for this campaign, keeping others
      const updatedCosts = await getCostsByCampaign(costData.project_id, costData.campaign_id);
      set((state) => {
        const otherCosts = state.costs.filter(c => c.campaign_id !== costData.campaign_id);
        return { costs: [...otherCosts, ...updatedCosts] };
      });
    } catch (error) {
      console.error('Error creating cost:', error);
      throw error;
    }
  },

  addCostBatch: async (costDataArray) => {
    try {
      await createCostBatch(costDataArray);

      // Reload costs to get updated list
      if (costDataArray.length > 0) {
        const { loadCosts } = get();
        const firstCost = costDataArray[0];
        await loadCosts(firstCost.project_id, firstCost.campaign_id);
      }
    } catch (error) {
      console.error('Error creating cost batch:', error);
      throw error;
    }
  },

  updateCost: async (id, updates) => {
    try {
      await updateCostApi(id, {
        category: updates.category,
        details: updates.details,
        total_amount: updates.total_amount,
      });

      // Reload costs for this campaign, keeping others
      const currentCost = get().costs.find(c => c.id === id);
      if (currentCost) {
        const updatedCosts = await getCostsByCampaign(currentCost.project_id, currentCost.campaign_id);
        set((state) => {
          const otherCosts = state.costs.filter(c => c.campaign_id !== currentCost.campaign_id);
          return { costs: [...otherCosts, ...updatedCosts] };
        });
      }
    } catch (error) {
      console.error('Error updating cost:', error);
      throw error;
    }
  },

  deleteCost: async (id) => {
    try {
      await deleteCostApi(id);

      // Reload costs for this campaign, keeping others
      const currentCost = get().costs.find(c => c.id === id);
      if (currentCost) {
        const updatedCosts = await getCostsByCampaign(currentCost.project_id, currentCost.campaign_id);
        set((state) => {
          const otherCosts = state.costs.filter(c => c.campaign_id !== currentCost.campaign_id);
          return { costs: [...otherCosts, ...updatedCosts] };
        });
      }
    } catch (error) {
      console.error('Error deleting cost:', error);
      throw error;
    }
  },

  addInvestment: async (investment) => {
    // Validación: Campaign ID válido
    if (!investment.campaign_id || investment.campaign_id <= 0) {
      throw new Error('Valid campaign ID is required for investment');
    }

    // Validación: Monto positivo
    if (investment.amount <= 0) {
      throw new Error('Investment amount must be positive');
    }

    // Validación: Categoría requerida
    if (!investment.category?.trim()) {
      throw new Error('Investment category is required');
    }

    set((state) => ({ investments: [...state.investments, investment] }));
  },

  updateInvestment: async (id, updates) => {
    const currentInvestment = get().investments.find((i: InvestmentRecord) => i.id === id);
    if (!currentInvestment) {
      throw new Error(`Investment with ID ${id} not found`);
    }

    // Validación: Campaign ID válido si se cambia
    if (updates.campaign_id !== undefined && (updates.campaign_id <= 0)) {
      throw new Error('Valid campaign ID is required for investment');
    }

    // Validación: Monto positivo si se cambia
    if (updates.amount !== undefined && updates.amount <= 0) {
      throw new Error('Investment amount must be positive');
    }

    // For now, still update local state
    set((state) => ({
      investments: state.investments.map((i: InvestmentRecord) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    }));

    // TODO: Call API to update in database
  },

  deleteInvestment: async (id) => {
    const investment = get().investments.find((i: InvestmentRecord) => i.id === id);
    if (!investment) {
      throw new Error(`Investment with ID ${id} not found`);
    }

    // For now, still remove from local state
    set((state) => ({
      investments: state.investments.filter((i: InvestmentRecord) => i.id !== id),
    }));

    // TODO: Call API to delete from database
  },

  // Production actions
  addProduction: (production: ProductionRecord) => {
    // Validación: Kg positivo
    if (production.quantity_kg < 0) {
      throw new Error('Production kg must be non-negative');
    }

    // Validación: ID único
    if (get().productions.some((p: ProductionRecord) => p.id === production.id)) {
      throw new Error(`Production with ID ${production.id} already exists`);
    }

    set((state) => ({ productions: [...state.productions, production] }));
  },
  updateProduction: (id: number, updates: Partial<ProductionRecord>) => {
    const currentProduction = get().productions.find((p: ProductionRecord) => p.id === id);
    if (!currentProduction) {
      throw new Error(`Production with ID ${id} not found`);
    }

    // Validación: Kg positivo si se cambia
    if (updates.quantity_kg !== undefined && updates.quantity_kg < 0) {
      throw new Error('Production kg must be non-negative');
    }

    set((state) => ({
      productions: state.productions.map((p: ProductionRecord) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },
  deleteProduction: (id: number) => {
    const production = get().productions.find((p: ProductionRecord) => p.id === id);
    if (!production) {
      throw new Error(`Production with ID ${id} not found`);
    }

    set((state) => ({
      productions: state.productions.filter((p: ProductionRecord) => p.id !== id),
    }));
  },

  // Production Campaign actions
  addProductionCampaign: (productionCampaign: ProductionCampaign) => {
    // Validación: Año válido
    if (!productionCampaign.year || productionCampaign.year < 2000 || productionCampaign.year > 2100) {
      throw new Error('Valid year is required for production campaign');
    }

    // Validación: Valores positivos
    if (productionCampaign.averagePrice < 0 || productionCampaign.totalProduction < 0) {
      throw new Error('Production campaign values must be non-negative');
    }

    // Si ya existe, actualizar en lugar de agregar
    const existing = get().productionCampaigns.find((pc: ProductionCampaign) => pc.id === productionCampaign.id);
    if (existing) {
      set((state) => ({
        productionCampaigns: state.productionCampaigns.map((pc: ProductionCampaign) =>
          pc.id === productionCampaign.id ? { ...pc, ...productionCampaign } : pc
        ),
      }));
    } else {
      set((state) => ({ productionCampaigns: [...state.productionCampaigns, productionCampaign] }));
    }
  },
  updateProductionCampaign: (id: string, updates: Partial<ProductionCampaign>) => {
    const currentProductionCampaign = get().productionCampaigns.find((pc: ProductionCampaign) => pc.id === id);
    if (!currentProductionCampaign) {
      throw new Error(`Production campaign with ID ${id} not found`);
    }

    // Validación: Año válido si se cambia
    if (updates.year !== undefined && (updates.year < 2000 || updates.year > 2100)) {
      throw new Error('Valid year is required for production campaign');
    }

    // Validación: Valores positivos si se cambian
    if ((updates.averagePrice !== undefined && updates.averagePrice < 0) ||
        (updates.totalProduction !== undefined && updates.totalProduction < 0)) {
      throw new Error('Production campaign values must be non-negative');
    }

    set((state) => ({
      productionCampaigns: state.productionCampaigns.map((pc: ProductionCampaign) =>
        pc.id === id ? { ...pc, ...updates } : pc
      ),
    }));
  },
  deleteProductionCampaign: (id: string) => {
    const productionCampaign = get().productionCampaigns.find((pc: ProductionCampaign) => pc.id === id);
    if (!productionCampaign) {
      throw new Error(`Production campaign with ID ${id} not found`);
    }

    set((state) => ({
      productionCampaigns: state.productionCampaigns.filter((pc: ProductionCampaign) => pc.id !== id),
    }));
  },
  loadProductions: async (campaignId: number) => {
    try {
      // 2. USAR EL SERVICIO (El mensajero)
      // Llamamos a la función que trajimos del archivo productionService
      const records = await getProductionsByCampaign(campaignId);

      // Nota: Aquí 'records' ya viene con los datos de la DB gracias al servicio.

      // Calcular el total de producción desde los registros
      const totalProduction = records.reduce((sum: number, record: any) => sum + (record.quantity_kg || 0), 0);

      // Buscar la campaña correspondiente para obtener el precio
      const campaign = get().campaigns.find(c => c.id === campaignId);
      const averagePrice = campaign?.average_price ? Number(campaign.average_price) : 0;

      set((state) => {
        // Borramos los viejos de esta campaña y ponemos los nuevos
        const otherProductions = state.productions.filter(p => p.campaign_id !== campaignId);

        // Actualizar también productionCampaigns con los datos calculados
        const campaignYear = campaign?.year || new Date().getFullYear();
        const existingCampaign = state.productionCampaigns.find(pc => pc.year === campaignYear);

        let updatedProductionCampaigns = state.productionCampaigns;
        if (existingCampaign) {
          // Actualizar campaña existente
          updatedProductionCampaigns = state.productionCampaigns.map(pc =>
            pc.year === campaignYear
              ? { ...pc, averagePrice, totalProduction, date: new Date() }
              : pc
          );
        } else {
          // Agregar nueva campaña
          updatedProductionCampaigns = [...state.productionCampaigns, {
            id: `campaign-${campaignYear}`,
            year: campaignYear,
            averagePrice,
            totalProduction,
            date: new Date(),
          }];
        }

        // Asumimos que el servicio devuelve ProductionRecord[] compatible
        return {
          productions: [...otherProductions, ...records],
          productionCampaigns: updatedProductionCampaigns
        };
      });
    } catch (error) {
      console.error('Error loading productions:', error);
    }
  },
  addProductionBatch: async (dataPayload: any) => {
    try {
      // dataPayload debería tener: { project_id, input_type, productions: [...] }
      
      // 3. ENVIAR AL SERVIDOR
      await createProductionsByCampaign(dataPayload.campaign_id, {
          project_id: dataPayload.project_id,
          productions: dataPayload.productions, // Array con monte_id, quantity_kg
          input_type: dataPayload.input_type // 'total' o 'detail'
      });

      // 4. RECARGAR DESDE EL SERVIDOR
      // Es mejor recargar todo para asegurarnos que tenemos los IDs reales y datos calculados
      const { loadProductions } = get();
      await loadProductions(dataPayload.campaign_id);

    } catch (error) {
      console.error('Error saving productions:', error);
      throw error;
    }
  },
  loadAllProductions: async (campaigns: { id: number }[]) => {
    try {
      const allProductions: ProductionRecord[] = [];
      const updatedProductionCampaigns: ProductionCampaign[] = [];

      for (const campaign of campaigns) {
        const records = await getProductionsByCampaign(campaign.id);

        if (Array.isArray(records)) {
          const cleanRecords = records.map((r: any) => ({
            ...r,
            id: Number(r.id),
            campaign_id: Number(campaign.id),
            monte_id: Number(r.monte_id),
            quantity_kg: Number(r.quantity_kg)
          }));
          allProductions.push(...cleanRecords);
        }

        // Poblar productionCampaigns desde campaigns (igual que en Produccion.tsx)
        const campaignData = campaigns.find(c => c.id === campaign.id);
        if (campaignData && (campaignData as any).average_price !== undefined && (campaignData as any).total_production !== undefined) {
          const averagePrice = parseFloat((campaignData as any).average_price);
          const totalProduction = parseFloat((campaignData as any).total_production);
          const date = new Date((campaignData as any).updated_at || (campaignData as any).created_at);

          updatedProductionCampaigns.push({
            id: `campaign-${(campaignData as any).year}`,
            year: (campaignData as any).year,
            averagePrice,
            totalProduction,
            date,
          });
        }
      }

      set({
        productions: allProductions,
        productionCampaigns: updatedProductionCampaigns
      });

    } catch (error) {
      console.error('Error loading all productions:', error);
    }
  },

  getTotalProductionByCampaign: (campaignId: number | string): number => {
    const { productions } = useDataStore.getState();
    const targetId = Number(campaignId);

    if (!targetId) return 0;

    return productions
      .filter(p => Number(p.campaign_id) === targetId)
      .reduce((sum, p) => sum + (Number(p.quantity_kg) || 0), 0);
  },

  // Backup/Restore functionality
  createBackup: () => {
    const state = get();
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        projects: state.projects,
        campaigns: state.campaigns,
        costs: state.costs,
        investments: state.investments,
        productions: state.productions,
        productionCampaigns: state.productionCampaigns,
      },
    };
    return backup;
  },
  restoreFromBackup: (backup: DataBackup) => {
    // Validación básica del backup
    if (!backup.version || !backup.data) {
      throw new Error('Invalid backup format');
    }

    // Validación de estructura
    const requiredKeys: (keyof DataBackup['data'])[] = ['projects', 'campaigns', 'costs', 'investments', 'productions', 'productionCampaigns'];
    for (const key of requiredKeys) {
      if (!Array.isArray(backup.data[key])) {
        throw new Error(`Invalid backup: ${key} must be an array`);
      }
    }

    // Restaurar datos
    set(() => ({
      projects: backup.data.projects,
      campaigns: backup.data.campaigns,
      costs: backup.data.costs,
      investments: backup.data.investments,
      productions: backup.data.productions,
      productionCampaigns: backup.data.productionCampaigns,
    }));
  },
  clearAllData: () => {
    set(() => ({
      projects: [],
      campaigns: [],
      costs: [],
      investments: [],
      productions: [],
      productionCampaigns: [],
    }));
  },


    }),
    {
      name: 'calculador-data-store',
      version: 1,
    }
  )
);