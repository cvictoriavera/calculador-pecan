import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { createCampaign, getCampaignsByProject } from "@/services/campaignService";
import { getProjects } from "@/services/projectService";
import { getMontesByProject, createMonte, updateMonte as updateMonteAPI, deleteMonte } from "@/services/monteService";

export interface Monte {
  id: string;
  nombre: string;
  hectareas: number;
  densidad: number;
  añoPlantacion: number;
  variedad: string;
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
  campaigns: Campaign[];
  campaignsLoading: boolean;
  currentCampaign: number;
  setCurrentCampaign: (year: number) => void;
  currentCampaignId: number | null;
  montes: Monte[];
  montesLoading: boolean;
  addMonte: (monte: Omit<Monte, "id">) => void;
  updateMonte: (id: string, monte: Omit<Monte, "id">) => void;
  deleteMonte: (id: string) => void;
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState(() => {
    const stored = localStorage.getItem("currentCampaign");
    return stored ? parseInt(stored) : new Date().getFullYear();
  });
  const [currentCampaignId, setCurrentCampaignId] = useState<number | null>(null);
  const [montes, setMontes] = useState<Monte[]>([]);
  const [montesLoading, setMontesLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isOnboardingComplete = !!currentProjectId;

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


  // Load campaigns when project changes
  useEffect(() => {
    const loadCampaigns = async () => {
      if (!currentProjectId) {
        setCampaigns([]);
        return;
      }

      setCampaignsLoading(true);
      try {
        console.log('Loading campaigns for project:', currentProjectId);
        const data = await getCampaignsByProject(currentProjectId);
        console.log('Campaigns data:', data);
        const campaignsData = Array.isArray(data) ? data : [];
        setCampaigns(campaignsData);

        // Set current campaign ID
        const currentCamp = campaignsData.find(c => c.year === currentCampaign);
        console.log('Current campaign year:', currentCampaign, 'found:', currentCamp);
        if (currentCamp) {
          setCurrentCampaignId(currentCamp.id);
          console.log('Set currentCampaignId:', currentCamp.id);
        } else {
          console.log('No campaign found for current year');
        }
      } catch (error) {
        console.error('Error loading campaigns:', error);
        setCampaigns([]);
      } finally {
        setCampaignsLoading(false);
      }
    };

    loadCampaigns();
  }, [currentProjectId]);

  // Check for existing projects on mount
  useEffect(() => {
    const checkExistingProjects = async () => {
      console.log('Checking for existing projects...');
      console.log('Initial currentProjectId from localStorage:', localStorage.getItem("currentProjectId"));
      console.log('Initial isOnboardingComplete:', !!currentProjectId);
      try {
        const projects = await getProjects();
        console.log('Projects fetched:', projects);
        if (projects && projects.length > 0) {
          console.log('Found existing projects, loading first one');
          // Load the first project
          const project = projects[0];
          setCurrentProjectId(project.id);
          setProjectName(project.project_name);
          console.log('Set project:', project.project_name, project.id);

          // Fetch campaigns to get initial year
          const campaignsData = await getCampaignsByProject(project.id);
          console.log('Campaigns fetched:', campaignsData);
          if (campaignsData && campaignsData.length > 0) {
            const years = campaignsData.map(c => c.year);
            const minYear = Math.min(...years);
            setInitialYear(minYear);
            console.log('Set initial year:', minYear);
          }

          // Load montes
          setMontesLoading(true);
          try {
            const montesData = await getMontesByProject(project.id);
            console.log('Montes fetched:', montesData);
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
              console.log('Set montes:', transformedMontes);
            }
          } catch (error) {
            console.error('Error loading montes:', error);
          } finally {
            setMontesLoading(false);
          }
        } else {
          console.log('No existing projects found');
          console.log('currentProjectId before clearing:', currentProjectId);
          // Clear currentProjectId if no projects found
          setCurrentProjectId(null);
          setProjectName("");
          localStorage.removeItem("currentProjectId");
          localStorage.removeItem("projectName");
          console.log('Cleared currentProjectId and projectName');
        }
      } catch (error) {
        console.error('Error checking existing projects:', error);
      } finally {
        console.log('Setting loading to false');
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
      try {
        const campaignData = {
          project_id: projectId,
          campaign_name: `Campaña ${y}`,
          year: y,
          start_date: `${y}-01-01`,
          end_date: `${y}-12-31`,
          status: y === currentYear ? 'open' : 'closed',
          is_current: y === currentYear ? 1 : 0,
        };

        const createdCampaign = await createCampaign(campaignData);
        createdCampaigns.push(createdCampaign);
      } catch (error) {
        console.error(`Error creating campaign for year ${y}:`, error);
        // Continue with other campaigns even if one fails
      }
    }

    setCampaigns(createdCampaigns);
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
        variedad: monte.variedad,
      } as Parameters<typeof createMonte>[0];

      const createdMonte = await createMonte(monteData);
      console.log('Monte created:', createdMonte);

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
        variedad: updatedData.variedad,
      };

      const updatedMonte = await updateMonteAPI(parseInt(id), updateData);
      console.log('Monte updated:', updatedMonte);

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
      console.log('Monte deleted:', id);

      // Remove from local state
      setMontes(montes.filter(monte => monte.id !== id));
    } catch (error) {
      console.error('Error deleting monte:', error);
      throw error;
    }
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
        campaigns,
        campaignsLoading,
        currentCampaign,
        setCurrentCampaign,
        currentCampaignId,
        montes,
        montesLoading,
        addMonte,
        updateMonte,
        deleteMonte: deleteMonteContext,
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
