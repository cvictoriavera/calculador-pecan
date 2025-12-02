import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { createCampaign, getCampaignsByProject } from "@/services/campaignService";

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
  montes: Monte[];
  addMonte: (monte: Omit<Monte, "id">) => void;
  updateMonte: (id: string, monte: Omit<Monte, "id">) => void;
  isOnboardingComplete: boolean;
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
  const [montes, setMontes] = useState<Monte[]>(() => {
    const stored = localStorage.getItem("montes");
    return stored ? JSON.parse(stored) : [];
  });

  const isOnboardingComplete = !!projectName && !!initialYear;

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

  useEffect(() => {
    localStorage.setItem("montes", JSON.stringify(montes));
  }, [montes]);

  // Load campaigns when project changes
  useEffect(() => {
    const loadCampaigns = async () => {
      if (!currentProjectId) {
        setCampaigns([]);
        return;
      }

      setCampaignsLoading(true);
      try {
        const data = await getCampaignsByProject(currentProjectId);
        setCampaigns(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading campaigns:', error);
        setCampaigns([]);
      } finally {
        setCampaignsLoading(false);
      }
    };

    loadCampaigns();
  }, [currentProjectId]);

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

  const addMonte = (monte: Omit<Monte, "id">) => {
    const newMonte = {
      ...monte,
      id: Date.now().toString(),
    };
    setMontes([...montes, newMonte]);
  };

  const updateMonte = (id: string, updatedData: Omit<Monte, "id">) => {
    setMontes(montes.map(monte => 
      monte.id === id ? { ...updatedData, id } : monte
    ));
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
        montes,
        addMonte,
        updateMonte,
        isOnboardingComplete,
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
