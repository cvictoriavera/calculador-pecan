// UI Store - Estados de navegación y UI
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  // Navegación
  activeProjectId: string | null;
  activeCampaignId: string | null;
  currentPage: string;

  // UI States
  sidebarOpen: boolean;
  loadingStates: Record<string, boolean>;
  errors: Record<string, string | null>;

  // Acciones
  setActiveProject: (id: string | null) => void;
  setActiveCampaign: (id: string | null) => void;
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
      currentPage: 'dashboard',
      sidebarOpen: true,
      loadingStates: {},
      errors: {},

      // Acciones
      setActiveProject: (id) => set({ activeProjectId: id }),
      setActiveCampaign: (id) => set({ activeCampaignId: id }),
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
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);