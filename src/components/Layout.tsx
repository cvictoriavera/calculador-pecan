import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { useUiStore } from "@/stores";
import { useIsLargeScreen } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { projects, campaigns, currentCampaign, setCurrentCampaign, currentProjectId, montes, isTrialMode } = useApp();
  const { setCurrentCampaign: setStoreCurrentCampaign, setActiveCampaign } = useUiStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isProjectsPage = location.pathname === '/projects';

  // 1. Detectamos si es pantalla gigante (> 1400px)
  const isLargeScreen = useIsLargeScreen();

  // 2. Estado controlado del sidebar
  // Iniciamos el estado basado en si la pantalla es grande
  const [sidebarOpen, setSidebarOpen] = useState(isLargeScreen);

  // 3. Efecto reactivo:
  // - Si la pantalla crece (>1400), se abre (true).
  // - Si la pantalla se reduce (<1400), se cierra/contrae (false).
  useEffect(() => {
    setSidebarOpen(isLargeScreen);
  }, [isLargeScreen]);

  // Resto de lógica de campañas...
  const totalArea = montes
    .filter(m => m.añoPlantacion <= currentCampaign)
    .reduce((acc, m) => acc + m.hectareas, 0);

  useEffect(() => {
    if (campaigns.length > 0) {
      const campaign = campaigns.find(c => c.year === currentCampaign);
      if (campaign) setActiveCampaign(campaign.id);
    }
  }, [campaigns, currentCampaign, setActiveCampaign]);

  const handleCampaignChange = (year: number) => {
    setCurrentCampaign(year);
    setStoreCurrentCampaign(year);
    const campaign = campaigns.find(c => c.year === year);
    if (campaign) setActiveCampaign(campaign.id);
  };
  
  return (
    <SidebarProvider 
      open={sidebarOpen} 
      onOpenChange={setSidebarOpen}
      // Opcional: Ajustar el ancho del sidebar si lo necesitas
      style={{
        "--sidebar-width": "16rem",
        "--sidebar-width-mobile": "18rem",
      } as React.CSSProperties}
    >
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
          <header className="h-16 flex items-center justify-between px-6 border-none border-border bg-card shadow-sm sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-foreground" />
              
              {/* Bloque de selectores... igual a tu código */}
              {!isProjectsPage && (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Proyecto:</span>
                    <span className="text-sm font-semibold text-foreground truncate">
                      {projects.find(p => p.id === currentProjectId)?.project_name || "Sin proyecto"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Campaña:</span>
                    <Select
                      value={currentCampaign.toString()}
                      onValueChange={(value) => handleCampaignChange(parseInt(value))}
                    >
                      <SelectTrigger className="w-[140px] sm:w-[180px] bg-cream">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.filter(c => c && c.year).map((campaign) => (
                          <SelectItem key={campaign.id} value={campaign.year.toString()}>
                            Campaña {campaign.year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm">
              {!isProjectsPage && (
                <div className="text-right hidden sm:block">
                  <p className="text-muted-foreground m-0 text-xs">Área Total</p>
                  <p className="font-semibold text-foreground m-0">{totalArea.toFixed(1)} ha</p>
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full bg-cream">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                   <DropdownMenuItem onClick={() => navigate('/projects')}>
                     <ArrowLeft className="h-4 w-4 mr-2" />
                     Volver a proyectos
                   </DropdownMenuItem>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={() => navigate('/config')}>Configuración</DropdownMenuItem>
                   <DropdownMenuItem onClick={() => window.location.href = '/'}>Volver a Cappecan</DropdownMenuItem>
                 </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          {isTrialMode && (
            <div className="bg-yellow-100 border-b border-yellow-200 px-6 py-2 text-center">
              <p className="text-yellow-800 text-sm mb-0">
                <strong>Modo Prueba: Los datos de tus proyectos no se guardan permanentemente. Convertite en Socio de la CAPPECAN para acceder a todas las funciones de la herramienta. </strong> <a href="https://forms.gle/hcgwjZAgLoMjATcFA" target="_blank" rel="noopener noreferrer" className="underline font-semibold"><strong>HACE CLIC AQUI</strong></a>
              </p>
            </div>
          )}
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-hidden w-full max-w-[100vw]">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}