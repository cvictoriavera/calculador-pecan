import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { createCampaign, getCampaignsByProject, updateCampaign } from "@/services/campaignService";
import { getProjects, deleteProject } from "@/services/projectService";
import { getMontesByProject, createMonte, updateMonte as updateMonteAPI, deleteMonte } from "@/services/monteService";
import { getCurrentUser } from "@/services/userService";
import { useDataStore } from "@/stores";

export interface Monte {
  id: string;
  nombre: string;
  hectareas: number;
  densidad: number;
  añoPlantacion: number;
  variedad?: string;
}

interface Campaign {
  id: number;
  project_id: number;
  campaign_name: string;
  year: number;
  start_date: string;
  end_date: string | null;
  status: 'open' | 'closed' | 'archived';
  is_current: number;
  notes?: string;
  average_price?: string;
  total_production?: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  name: string;
  email?: string;
  username?: string;
  roles?: string[];
}

interface Project {
  id: number;
  user_id: number;
  project_name: string;
  description?: string;
  pais?: string;
  provincia?: string;
  departamento?: string;
  municipio?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface AppContextType {
   user: User | null;
   isTrialMode: boolean;
   projectName: string;
   setProjectName: (name: string) => void;
   currentProjectId: number | null;
   setCurrentProjectId: (id: number) => void;
   initialYear: number | null;
   setInitialYear: (year: number) => void;
   projects: Project[];
   projectsLoading: boolean;
   loadProjects: () => Promise<void>;
  campaigns: Campaign[];
  campaignsLoading: boolean;
  currentCampaign: number;
  setCurrentCampaign: (year: number) => void;
  currentCampaignId: number | null;
  montes: Monte[];
  montesLoading: boolean;
  costsLoading: boolean;
  addMonte: (monte: Omit<Monte, "id">) => void;
  updateMonte: (id: string, monte: Omit<Monte, "id">) => void;
  deleteMonte: (id: string) => void;
  updateCampaign: (campaignId: number, data: any) => Promise<any>;
  changeProject: (projectId: number) => void;
  deleteProject: (projectId: number) => Promise<void>;
  loadCampaigns: () => Promise<void>;
  isOnboardingComplete: boolean;
  isLoading: boolean;
  completeOnboarding: (name: string, year: number, projectId: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {

  const [user, setUser] = useState<User | null>(null);
  const [isTrialMode, setIsTrialMode] = useState(false);

  const [projectName, setProjectName] = useState(() =>
    localStorage.getItem("projectName") || ""
  );
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(() => {
    const stored = localStorage.getItem("currentProjectId");
    return stored ? parseInt(stored) : null;
  });
  const [initialYear, setInitialYear] = useState<number | null>(() => {
    const stored = localStorage.getItem("initialYear");
    return stored ? parseInt(stored) : null;
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Log when projects change
  useEffect(() => {
    console.log('AppContext: Projects state updated', projects);
  }, [projects]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState(() => {
    const stored = localStorage.getItem("currentCampaign");
    return stored ? parseInt(stored) : new Date().getFullYear();
  });
  const [currentCampaignId, setCurrentCampaignId] = useState<number | null>(null);
  const [montes, setMontes] = useState<Monte[]>([]);
  const [montesLoading, setMontesLoading] = useState(false);
  const [costsLoading, setCostsLoading] = useState(false);
  const [isChangingProject, setIsChangingProject] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isOnboardingComplete = projects.length > 0 || !!currentProjectId;
  // Fetch user data and set trial mode
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        const trial = userData.roles?.includes('subscriber') || false;
        setIsTrialMode(trial);
        localStorage.setItem('isTrialMode', trial.toString());
      } catch (error) {
        console.error('Error fetching user:', error);
        // If error, assume not trial
        setIsTrialMode(false);
        localStorage.setItem('isTrialMode', 'false');
      }
    };
    fetchUser();
  }, []);

  const { loadAllCosts, loadAllInvestments } = useDataStore();

  // Sincronizar Contexto con Zustand
  useEffect(() => {
    if (currentProjectId && campaigns.length > 0 && !isChangingProject) {

      // Mapeamos las campañas para adaptar las propiedades que faltan
      const campaignsForStore = campaigns.map(c => ({
        ...c,
        projectId: c.project_id, // Mapeamos project_id -> projectId
        name: c.campaign_name    // Mapeamos campaign_name -> name
      }));

      // Cargar Costos
      setCostsLoading(true);
      loadAllCosts(currentProjectId, campaignsForStore as any).finally(() => setCostsLoading(false));

      // Cargar Inversiones
      loadAllInvestments(currentProjectId, campaignsForStore as any);
    }
  }, [currentProjectId, campaigns, loadAllCosts, loadAllInvestments, isChangingProject]);

  useEffect(() => {
    localStorage.setItem("projectName", projectName);
  }, [projectName]);

  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem("currentProjectId", currentProjectId.toString());
    }
  }, [currentProjectId]);

  useEffect(() => {
    if (initialYear) {
      localStorage.setItem("initialYear", initialYear.toString());
    }
  }, [initialYear]);


  useEffect(() => {
    localStorage.setItem("currentCampaign", currentCampaign.toString());
  }, [currentCampaign]);


  // Load projects function
  const loadProjects = async () => {
    console.log('AppContext: Loading projects');
    setProjectsLoading(true);
    try {
      const fetchedProjects = await getProjects();
      console.log('AppContext: Refetched projects', fetchedProjects);
      setProjects(fetchedProjects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Load campaigns function
   const loadCampaigns = async () => {
     if (!currentProjectId) {
       setCampaigns([]);
       return;
     }

     setCampaignsLoading(true);
     try {

       const data = await getCampaignsByProject(currentProjectId);

       const campaignsData = Array.isArray(data) ? data : [];
       setCampaigns(campaignsData);

      // Set current campaign ID
      updateCurrentCampaignId(campaignsData);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setCampaigns([]);
    } finally {
      setCampaignsLoading(false);
    }
  };

  // Load campaigns when project changes
  useEffect(() => {
    loadCampaigns();
  }, [currentProjectId]);

  // Update current campaign ID when currentCampaign changes
  const updateCurrentCampaignId = (campaignsData: Campaign[]) => {

    const currentCamp = campaignsData.find(c => c.year == currentCampaign);

    if (currentCamp) {
      setCurrentCampaignId(currentCamp.id);

    } else {

      // Create the missing campaign using the same format as onboarding
      createCampaign({
        project_id: currentProjectId!,
        campaign_name: `Campaña ${currentCampaign}`,
        year: currentCampaign,
        start_date: `Julio ${currentCampaign}`,
        end_date: `Junio ${currentCampaign + 1}`,
        status: 'open',
        is_current: 1,
      }).then(newCampaign => {

        const updatedCampaigns = [...campaignsData, newCampaign];
        setCampaigns(updatedCampaigns);
        setCurrentCampaignId(newCampaign.id);
      }).catch(error => {
        console.error('Error creating campaign:', error);
      });
    }
  };

  useEffect(() => {
    if (campaigns.length > 0) {
      updateCurrentCampaignId(campaigns);
    }
  }, [currentCampaign, campaigns]);

  // Check for existing projects on mount
   useEffect(() => {
     const checkExistingProjects = async () => {
       setProjectsLoading(true);
       console.log('AppContext: Loading projects on mount');
       try {
         const fetchedProjects = await getProjects();
         console.log('AppContext: Fetched projects', fetchedProjects);
         if (fetchedProjects && fetchedProjects.length > 0) {
           setProjects(fetchedProjects);
          // Load the first project
          const project = fetchedProjects[0];
          setCurrentProjectId(project.id);
          setProjectName(project.project_name);

          // Fetch campaigns to get initial year
          const campaignsData = await getCampaignsByProject(project.id);
          if (campaignsData && campaignsData.length > 0) {
            const years = campaignsData.map(c => c.year);
            const minYear = Math.min(...years);
            setInitialYear(minYear);
          }

          // Load montes
          setMontesLoading(true);
          try {
            const montesData = await getMontesByProject(project.id);
            if (montesData && Array.isArray(montesData)) {
              // Transform DB data to frontend format
              const transformedMontes = montesData.map(monte => ({
                id: monte.id.toString(),
                nombre: monte.monte_name,
                hectareas: parseFloat(monte.area_hectareas),
                densidad: monte.plantas_por_hectarea,
                añoPlantacion: monte.fecha_plantacion ? parseInt(monte.fecha_plantacion.substring(0, 4)) : new Date().getFullYear(),
                variedad: monte.variedad,
              }));
              setMontes(transformedMontes);
            } else {

              setMontes([]);
            }
          } catch (error) {
            console.error('Error loading montes:', error);
          } finally {
            setMontesLoading(false);
            setIsChangingProject(false);
          }
        } else {

          // Clear currentProjectId if no projects found
          setCurrentProjectId(null);
          setProjectName("");
          localStorage.removeItem("currentProjectId");
          localStorage.removeItem("projectName");
          setProjects([]);
        }
      } catch (error) {
        console.error('Error checking existing projects:', error);
        setProjects([]);
      } finally {
        setProjectsLoading(false);
        setIsLoading(false);
      }
    };

    checkExistingProjects();
  }, []);

  const completeOnboarding = async (name: string, year: number, projectId: number) => {
    // Clear existing data before setting new project
    setMontes([]);
    setMontesLoading(true);
    setCampaigns([]);
    setCurrentCampaignId(null);
    // Clear data stores
    useDataStore.getState().clearAllData();

    setProjectName(name);
    setCurrentProjectId(projectId);
    setInitialYear(year);

    // Refetch projects to ensure the new project is in the list
    try {
      const updatedProjects = await getProjects();
      setProjects(updatedProjects);
    } catch (error) {
      console.error('Error refetching projects:', error);
    }

    const currentYear = new Date().getFullYear();
    const createdCampaigns: Campaign[] = [];

    // Create campaigns for each year from initial year to current year
    for (let y = year; y <= currentYear; y++) {
      const campaignData = {
        project_id: projectId,
        campaign_name: `Campaña ${y}`,
        year: y,
        start_date: `Julio ${y}`,
        end_date: `Junio ${y+1}`,
        status: y === currentYear ? 'open' : 'closed',
        is_current: y === currentYear ? 1 : 0,
      };

      try {
        const createdCampaign = await createCampaign(campaignData);
        createdCampaigns.push(createdCampaign);
      } catch (error) {
        console.error(`Error creating campaign for year ${y}:`, error);
        // Try to get existing campaign
        try {
          const existingCampaigns = await getCampaignsByProject(projectId);
          const existing = existingCampaigns.find(c => c.year === y);
          if (existing) {
            console.log(`Found existing campaign for year ${y}:`, existing);
            createdCampaigns.push(existing);
          } else {
            console.error(`No existing campaign found for year ${y}`);
          }
        } catch (fetchError) {
          console.error(`Error fetching existing campaign for year ${y}:`, fetchError);
        }
      }
    }

    // Set campaigns directly from created ones to avoid timing issues
    const sortedCampaigns = createdCampaigns.sort((a, b) => a.year - b.year);
    setCampaigns(sortedCampaigns);
    setCurrentCampaign(currentYear);

    // Load montes for the new project
    try {
      const montesData = await getMontesByProject(projectId);
      if (montesData && Array.isArray(montesData)) {
        const transformedMontes = montesData.map(monte => ({
          id: monte.id.toString(),
          nombre: monte.monte_name,
          hectareas: parseFloat(monte.area_hectareas),
          densidad: monte.plantas_por_hectarea,
          añoPlantacion: monte.fecha_plantacion ? parseInt(monte.fecha_plantacion.substring(0, 4)) : new Date().getFullYear(),
          variedad: monte.variedad,
        }));
        setMontes(transformedMontes);
      } else {
        setMontes([]);
      }
    } catch (error) {
      console.error('Error loading montes for new project:', error);
      setMontes([]);
    } finally {
      setMontesLoading(false);
      setIsChangingProject(false);
    }
  };

  const addMonte = async (monte: Omit<Monte, "id">) => {
    if (!currentProjectId) {
      console.error('No current project');
      return;
    }

    try {
      const monteData = {
        project_id: currentProjectId,
        campaign_created_id: currentCampaignId || undefined,
        monte_name: monte.nombre,
        area_hectareas: monte.hectareas,
        plantas_por_hectarea: monte.densidad,
        fecha_plantacion: `${monte.añoPlantacion}-01-01`,
      } as Parameters<typeof createMonte>[0];

      const createdMonte = await createMonte(monteData);

      // Transform to frontend format
      const newMonte: Monte = {
        id: createdMonte.id.toString(),
        nombre: createdMonte.monte_name,
        hectareas: parseFloat(createdMonte.area_hectareas),
        densidad: createdMonte.plantas_por_hectarea,
        añoPlantacion: createdMonte.fecha_plantacion ? parseInt(createdMonte.fecha_plantacion.substring(0, 4)) : monte.añoPlantacion,
        variedad: createdMonte.variedad,
      };

      setMontes([...montes, newMonte]);
    } catch (error) {
      console.error('Error creating monte:', error);
      throw error;
    }
  };

  const updateMonte = async (id: string, updatedData: Omit<Monte, "id">) => {
    try {
      if (!isTrialMode) {
        const updateData = {
          monte_name: updatedData.nombre,
          area_hectareas: updatedData.hectareas,
          plantas_por_hectarea: updatedData.densidad,
          fecha_plantacion: `${updatedData.añoPlantacion}-01-01`,
        };
        console.log('Sending update data for monte:', id, updateData);

        const updatedMonte = await updateMonteAPI(parseInt(id), updateData);

        // Transform and update local state
        const transformed: Monte = {
          id: updatedMonte.id.toString(),
          nombre: updatedMonte.monte_name,
          hectareas: parseFloat(updatedMonte.area_hectareas),
          densidad: updatedMonte.plantas_por_hectarea,
          añoPlantacion: updatedMonte.fecha_plantacion ? parseInt(updatedMonte.fecha_plantacion.substring(0, 4)) : updatedData.añoPlantacion,
          variedad: updatedMonte.variedad,
        };

        setMontes(montes.map(monte =>
          monte.id === id ? transformed : monte
        ));
      } else {
        // For trial mode, just update local state
        const updated: Monte = {
          id,
          ...updatedData,
        };
        setMontes(montes.map(monte =>
          monte.id === id ? updated : monte
        ));
      }
    } catch (error) {
      console.error('Error updating monte:', error);
      throw error;
    }
  };

  const deleteMonteContext = async (id: string) => {
    try {
      if (!isTrialMode) {
        console.log('Deleting monte:', id);
        await deleteMonte(parseInt(id));
      }

      // Remove from local state (always, for both modes)
      setMontes(montes.filter(monte => monte.id !== id));
    } catch (error) {
      console.error('Error deleting monte:', error);
      throw error;
    }
  };

  const updateCampaignInContext = async (campaignId: number, data: any) => {
    try {
      const updated = await updateCampaign(campaignId, data);
      setCampaigns(campaigns.map(c => c.id === campaignId ? updated : c));
      return updated;
    } catch (error) {
      console.error('Error updating campaign in context:', error);
      throw error;
    }
  };

  const changeProject = async (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    console.log('Changing to project:', projectId);

    // Set flag to prevent automatic loading
    setIsChangingProject(true);

    // Clear existing data before switching
    setMontes([]);
    setMontesLoading(true);
    // Clear data stores
    useDataStore.getState().clearAllData();

    setCurrentProjectId(projectId);
    setProjectName(project.project_name);

    // Reset campaign to current year or find appropriate
    const currentYear = new Date().getFullYear();
    setCurrentCampaign(currentYear);

    // Prioridad 1: Datos críticos para navegación (campañas y montes en paralelo)
    try {
      console.log('Loading critical data for project:', projectId);

      const [campaignsData, montesData] = await Promise.all([
        getCampaignsByProject(projectId),
        getMontesByProject(projectId)
      ]);

      // Procesar campañas
      const campaignsArray = Array.isArray(campaignsData) ? campaignsData : [];
      console.log('Loaded campaigns:', campaignsArray);
      setCampaigns(campaignsArray);

      // Set current campaign ID
      const currentCamp = campaignsArray.find(c => c.year === currentYear);
      if (currentCamp) {
        setCurrentCampaignId(currentCamp.id);
      } else {
        setCurrentCampaignId(null);
      }

      // Procesar montes
      if (montesData && Array.isArray(montesData)) {
        const transformedMontes = montesData.map(monte => ({
          id: monte.id.toString(),
          nombre: monte.monte_name,
          hectareas: parseFloat(monte.area_hectareas),
          densidad: monte.plantas_por_hectarea,
          añoPlantacion: monte.fecha_plantacion ? parseInt(monte.fecha_plantacion.substring(0, 4)) : new Date().getFullYear(),
          variedad: monte.variedad,
        }));
        setMontes(transformedMontes);
        console.log('Montes loaded:', transformedMontes.length);
      } else {
        setMontes([]);
      }

      // Prioridad 2: Datos para dashboard principal (costos e inversiones en paralelo)
      if (campaignsArray.length > 0) {
        console.log('Loading dashboard data for campaigns:', campaignsArray.length);
        const campaignsForStore = campaignsArray.map(c => ({
          ...c,
          projectId: c.project_id,
          name: c.campaign_name
        }));

        // Load costs and investments in parallel with Promise.allSettled
        setCostsLoading(true);
        const [costsResult, investmentsResult] = await Promise.allSettled([
          useDataStore.getState().loadAllCosts(projectId, campaignsForStore as any),
          useDataStore.getState().loadAllInvestments(projectId, campaignsForStore as any)
        ]);

        if (costsResult.status === 'fulfilled') {
          console.log('Costs loaded successfully');
        } else {
          console.error('Error loading costs:', costsResult.reason);
        }

        if (investmentsResult.status === 'fulfilled') {
          console.log('Investments loaded successfully');
        } else {
          console.error('Error loading investments:', investmentsResult.reason);
        }
      }
    } catch (error) {
      console.error('Error loading critical data:', error);
      setCampaigns([]);
      setMontes([]);
    } finally {
      setMontesLoading(false);
      setCostsLoading(false);
      setIsChangingProject(false);
    }

  };

  // AppContext.tsx

const deleteProjectContext = async (projectId: number) => {
  try {
    await deleteProject(projectId);

    // 1. Actualizar lista local
    const remainingProjects = projects.filter(p => p.id !== projectId);
    setProjects(remainingProjects);

    // 2. Si borramos el proyecto que estábamos usando
    if (currentProjectId === projectId) {
      
      // Limpiamos la selección actual (dejamos al usuario "en el limbo" dentro de la app)
      setCurrentProjectId(null);
      setProjectName("");
      
      // Limpiamos persistencia y datos de Zustand
      localStorage.removeItem("currentProjectId");
      localStorage.removeItem("projectName");
      localStorage.removeItem("initialYear"); 
      localStorage.removeItem("currentCampaign");
      
      useDataStore.getState().clearAllData();
      
      // NOTA: No hacemos navigate aquí porque el Context no suele tener el hook de navegación.
      // La redirección la haremos desde el componente que tiene el botón de borrar.
    }
    
    // Si no quedaran proyectos (remainingProjects.length === 0), 
    // la variable isOnboardingComplete pasará a false automáticamente 
    // y el App.tsx redirigirá a Onboarding. Eso es correcto.

  } catch (error) {
    console.error('Error al eliminar:', error);
    throw error;
  }
};



  return (
    <AppContext.Provider
      value={{
         user,
         isTrialMode,
         projectName,
         setProjectName,
         currentProjectId,
         setCurrentProjectId,
         initialYear,
         setInitialYear,
         projects,
         projectsLoading,
         loadProjects,
        campaigns,
        campaignsLoading,
        currentCampaign,
        setCurrentCampaign,
        currentCampaignId,
        montes,
        montesLoading,
        costsLoading,
        addMonte,
        updateMonte,
        deleteMonte: deleteMonteContext,
        updateCampaign: updateCampaignInContext,
        changeProject,
        deleteProject: deleteProjectContext,
        loadCampaigns,
        isOnboardingComplete,
        isLoading,
        completeOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
