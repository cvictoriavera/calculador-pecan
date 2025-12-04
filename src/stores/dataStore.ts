// Data Store - Datos principales de la aplicación
import { create } from 'zustand';

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
}

export interface CostRecord {
  id: string;
  year: number;
  category: string;
  description: string;
  amount: number;
  date: Date;
  data?: any;
}

export interface InvestmentRecord {
  id: string;
  campaignId: number;
  category: string;
  description: string;
  amount: number;
  date: Date;
  data?: any;
}

export interface DataBackup {
  version: string;
  timestamp: string;
  data: {
    projects: Project[];
    campaigns: Campaign[];
    costs: CostRecord[];
    investments: InvestmentRecord[];
  };
}

interface DataState {
  // Datos
  projects: Project[];
  campaigns: Campaign[];
  costs: CostRecord[];
  investments: InvestmentRecord[];

  // Acciones
  addProject: (project: Project) => void;
  updateProject: (id: number, updates: Partial<Project>) => void;
  deleteProject: (id: number) => void;

  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: number, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: number) => void;

  addCost: (cost: CostRecord) => void;
  updateCost: (id: string, updates: Partial<CostRecord>) => void;
  deleteCost: (id: string) => void;

  addInvestment: (investment: InvestmentRecord) => void;
  updateInvestment: (id: string, updates: Partial<InvestmentRecord>) => void;
  deleteInvestment: (id: string) => void;

  // Backup/Restore
  createBackup: () => DataBackup;
  restoreFromBackup: (backup: DataBackup) => void;
  clearAllData: () => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  // Estado inicial
  projects: [],
  campaigns: [],
  costs: [],
  investments: [],

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

    // Validación: No eliminar si tiene investments
    const hasInvestments = get().investments.some((inv: InvestmentRecord) => inv.campaignId === id);

    if (hasInvestments) {
      throw new Error('Cannot delete campaign with existing investment records');
    }

    set((state) => ({
      campaigns: state.campaigns.filter((c: Campaign) => c.id !== id),
    }));
  },

  // Cost actions
  addCost: (cost) => {
    // Validación: Año válido
    if (!cost.year || cost.year < 2000 || cost.year > 2100) {
      throw new Error('Valid year is required for cost');
    }

    // Validación: Monto positivo
    if (cost.amount <= 0) {
      throw new Error('Cost amount must be positive');
    }

    // Validación: Categoría requerida
    if (!cost.category?.trim()) {
      throw new Error('Cost category is required');
    }

    set((state) => ({ costs: [...state.costs, cost] }));
  },

  updateCost: (id, updates) => {
    const currentCost = get().costs.find((c: CostRecord) => c.id === id);
    if (!currentCost) {
      throw new Error(`Cost with ID ${id} not found`);
    }

    // Validación: Año válido si se cambia
    if (updates.year !== undefined && (updates.year < 2000 || updates.year > 2100)) {
      throw new Error('Valid year is required for cost');
    }

    // Validación: Monto positivo si se cambia
    if (updates.amount !== undefined && updates.amount <= 0) {
      throw new Error('Cost amount must be positive');
    }

    set((state) => ({
      costs: state.costs.map((c: CostRecord) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  deleteCost: (id) => {
    const cost = get().costs.find((c: CostRecord) => c.id === id);
    if (!cost) {
      throw new Error(`Cost with ID ${id} not found`);
    }

    set((state) => ({
      costs: state.costs.filter((c: CostRecord) => c.id !== id),
    }));
  },

  // Investment actions
  addInvestment: (investment) => {
    // Validación: Campaign existe
    const campaignExists = get().campaigns.some((c: Campaign) => c.id === investment.campaignId);
    if (!campaignExists) {
      throw new Error(`Campaign with ID ${investment.campaignId} does not exist`);
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

  updateInvestment: (id, updates) => {
    const currentInvestment = get().investments.find((i: InvestmentRecord) => i.id === id);
    if (!currentInvestment) {
      throw new Error(`Investment with ID ${id} not found`);
    }

    // Validación: Campaign existe si se cambia
    if (updates.campaignId) {
      const campaignExists = get().campaigns.some((c: Campaign) => c.id === updates.campaignId);
      if (!campaignExists) {
        throw new Error(`Campaign with ID ${updates.campaignId} does not exist`);
      }
    }

    // Validación: Monto positivo si se cambia
    if (updates.amount !== undefined && updates.amount <= 0) {
      throw new Error('Investment amount must be positive');
    }

    set((state) => ({
      investments: state.investments.map((i: InvestmentRecord) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    }));
  },

  deleteInvestment: (id) => {
    const investment = get().investments.find((i: InvestmentRecord) => i.id === id);
    if (!investment) {
      throw new Error(`Investment with ID ${id} not found`);
    }

    set((state) => ({
      investments: state.investments.filter((i: InvestmentRecord) => i.id !== id),
    }));
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
    const requiredKeys: (keyof DataBackup['data'])[] = ['projects', 'campaigns', 'costs', 'investments'];
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
    }));
  },

  clearAllData: () => {
    set(() => ({
      projects: [],
      campaigns: [],
      costs: [],
      investments: [],
    }));
  },
}));