// UI Store - Estados de navegación y UI
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  // Navegación (migrado desde AppContext)
  activeProjectId: number | null;
  activeCampaignId: number | null;
  currentCampaign: number; // año actual (ej: 2024)
  currentPage: string;

  // UI States
  sidebarOpen: boolean;
  loadingStates: Record<string, boolean>;
  errors: Record<string, string | null>;

  // Acciones
  setActiveProject: (id: number | null) => void;
  setActiveCampaign: (id: number | null) => void;
  setCurrentCampaign: (year: number) => void;
  setCurrentPage: (page: string) => void;
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: string | null) => void;
  clearErrors: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      // Estado inicial
      activeProjectId: null,
      activeCampaignId: null,
      currentCampaign: new Date().getFullYear(),
      currentPage: 'dashboard',
      sidebarOpen: true,
      loadingStates: {},
      errors: {},

      // Acciones
      setActiveProject: (id) => set({ activeProjectId: id }),
      setActiveCampaign: (id) => set({ activeCampaignId: id }),
      setCurrentCampaign: (year) => set({ currentCampaign: year }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setLoading: (key, loading) =>
        set((state) => ({
          loadingStates: { ...state.loadingStates, [key]: loading }
        })),
      setError: (key, error) =>
        set((state) => ({
          errors: { ...state.errors, [key]: error }
        })),
      clearErrors: () => set({ errors: {} }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
        activeCampaignId: state.activeCampaignId,
        currentCampaign: state.currentCampaign,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);