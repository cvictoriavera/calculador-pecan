import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

export interface Monte {
  id: string;
  nombre: string;
  hectareas: number;
  densidad: number;
  añoPlantacion: number;
  variedad: string;
}

interface AppContextType {
  projectName: string;
  setProjectName: (name: string) => void;
  initialYear: number | null;
  setInitialYear: (year: number) => void;
  campaigns: number[];
  currentCampaign: number;
  setCurrentCampaign: (year: number) => void;
  montes: Monte[];
  addMonte: (monte: Omit<Monte, "id">) => void;
  updateMonte: (id: string, monte: Omit<Monte, "id">) => void;
  isOnboardingComplete: boolean;
  completeOnboarding: (name: string, year: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [projectName, setProjectName] = useState(() => 
    localStorage.getItem("projectName") || ""
  );
  const [initialYear, setInitialYear] = useState<number | null>(() => {
    const stored = localStorage.getItem("initialYear");
    return stored ? parseInt(stored) : null;
  });
  const [campaigns, setCampaigns] = useState<number[]>(() => {
    const stored = localStorage.getItem("campaigns");
    return stored ? JSON.parse(stored) : [];
  });
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
    if (initialYear) {
      localStorage.setItem("initialYear", initialYear.toString());
    }
  }, [initialYear]);

  useEffect(() => {
    localStorage.setItem("campaigns", JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem("currentCampaign", currentCampaign.toString());
  }, [currentCampaign]);

  useEffect(() => {
    localStorage.setItem("montes", JSON.stringify(montes));
  }, [montes]);

  const completeOnboarding = (name: string, year: number) => {
    setProjectName(name);
    setInitialYear(year);
    
    const currentYear = new Date().getFullYear();
    const generatedCampaigns = [];
    for (let y = year; y <= currentYear; y++) {
      generatedCampaigns.push(y);
    }
    setCampaigns(generatedCampaigns);
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
        initialYear,
        setInitialYear,
        campaigns,
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
