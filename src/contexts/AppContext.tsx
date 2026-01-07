import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { createCampaign, getCampaignsByProject, updateCampaign } from "@/services/campaignService";
import { getProjects } from "@/services/projectService";
import { getMontesByProject, createMonte, updateMonte as updateMonteAPI, deleteMonte } from "@/services/monteService";
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

interface Project {
  id: number;
  user_id: number;
  project_name: string;
  description?: string;
  pais?: string;
  region?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface AppContextType {
  projectName: string;
  setProjectName: (name: string) => void;
  currentProjectId: number | null;
  setCurrentProjectId: (id: number) => void;
  initialYear: number | null;
  setInitialYear: (year: number) => void;
  projects: Project[];
  projectsLoading: boolean;
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
  loadCampaigns: () => Promise<void>;
  isOnboardingComplete: boolean;
  isLoading: boolean;
  completeOnboarding: (name: string, year: number, projectId: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  
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
  const [isLoading, setIsLoading] = useState(true);

  const isOnboardingComplete = !!currentProjectId;

  const { loadAllCosts, loadAllInvestments } = useDataStore();

  // Sincronizar Contexto con Zustand
  useEffect(() => {
    if (currentProjectId && campaigns.length > 0) {

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
  }, [currentProjectId, campaigns, loadAllCosts, loadAllInvestments]);

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
     
      // Create the missing campaign
      createCampaign({
        project_id: currentProjectId!,
        campaign_name: `Campaña ${currentCampaign}`,
        year: currentCampaign,
        start_date: `${currentCampaign}-01-01`,
        end_date: `${currentCampaign}-12-31`,
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
      try {
        const fetchedProjects = await getProjects();
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
    setProjectName(name);
    setCurrentProjectId(projectId);
    setInitialYear(year);

    const currentYear = new Date().getFullYear();
    const createdCampaigns: Campaign[] = [];

    // Create campaigns for each year from initial year to current year
    for (let y = year; y <= currentYear; y++) {
      const campaignData = {
        project_id: projectId,
        campaign_name: `Campaña ${y}`,
        year: y,
        start_date: `${y}-01-01`,
        end_date: `${y}-12-31`,
        status: y === currentYear ? 'open' : 'closed',
        is_current: y === currentYear ? 1 : 0,
      };

      try {
        console.log(`Creating campaign for year ${y}:`, campaignData);
        const createdCampaign = await createCampaign(campaignData);
        console.log(`Successfully created campaign for year ${y}:`, createdCampaign);
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

    const data = await getCampaignsByProject(projectId);
    const sortedData = Array.isArray(data) ? data.sort((a, b) => a.year - b.year) : [];
    setCampaigns(sortedData);
    setCurrentCampaign(currentYear);
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
      const updateData = {
        monte_name: updatedData.nombre,
        area_hectareas: updatedData.hectareas,
        plantas_por_hectarea: updatedData.densidad,
        fecha_plantacion: `${updatedData.añoPlantacion}-01-01`,
      };

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
    } catch (error) {
      console.error('Error updating monte:', error);
      throw error;
    }
  };

  const deleteMonteContext = async (id: string) => {
    try {
      await deleteMonte(parseInt(id));

      // Remove from local state
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

    setCurrentProjectId(projectId);
    setProjectName(project.project_name);

    // Reset campaign to current year or find appropriate
    const currentYear = new Date().getFullYear();
    setCurrentCampaign(currentYear);

    // The useEffect on currentProjectId will handle loading campaigns and montes
  };



  return (
    <AppContext.Provider
      value={{
        projectName,
        setProjectName,
        currentProjectId,
        setCurrentProjectId,
        initialYear,
        setInitialYear,
        projects,
        projectsLoading,
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
