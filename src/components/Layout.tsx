import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { useUiStore } from "@/stores";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { projects, campaigns, currentCampaign, setCurrentCampaign, currentProjectId, changeProject, montes } = useApp();
  const { setCurrentCampaign: setStoreCurrentCampaign, setActiveCampaign } = useUiStore();
  const navigate = useNavigate();

  const totalArea = montes
    .filter(m => m.añoPlantacion <= currentCampaign)
    .reduce((acc, m) => acc + m.hectareas, 0);

  // Sincronizar activeCampaignId con currentCampaign
  useEffect(() => {
    if (campaigns.length > 0) {
      const campaign = campaigns.find(c => c.year === currentCampaign);
      if (campaign) {
        setActiveCampaign(campaign.id);
      }
    }
  }, [campaigns, currentCampaign, setActiveCampaign]);

  // Sincronizar currentCampaign con el store
  const handleCampaignChange = (year: number) => {
    setCurrentCampaign(year);
    setStoreCurrentCampaign(year);

    // Encontrar la campaña correspondiente y actualizar activeCampaignId
    const campaign = campaigns.find(c => c.year === year);
    if (campaign) {
      setActiveCampaign(campaign.id);
    }
  };
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between px-6 border-none border-border bg-card shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-foreground" />
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Proyecto:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-between bg-secondary">
                      {projects.find(p => p.id === currentProjectId)?.project_name || "Seleccionar Proyecto"}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px]">
                    <DropdownMenuLabel>Proyectos Recientes</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {projects.map((project) => (
                      <DropdownMenuItem
                        key={project.id}
                        onClick={() => changeProject(project.id)}
                        className={project.id === currentProjectId ? "bg-accent" : ""}
                      >
                        {project.project_name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Button variant="ghost" className="w-full justify-start p-0">
                        Crear Nuevo Proyecto
                      </Button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Campaña Actual:</span>
                <Select
                  value={currentCampaign.toString()}
                  onValueChange={(value) => handleCampaignChange(parseInt(value))}
                >
                  <SelectTrigger className="w-[180px] bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.filter(campaign => campaign && campaign.year).map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.year.toString()}>
                        Campaña {campaign.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-right">
                <p className="text-muted-foreground">Área Total Plantada</p>
                <p className="font-semibold text-foreground">{totalArea.toFixed(1)} ha</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.location.href = '/'}>Volver a Cappecan</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/config')}>Configuración</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
