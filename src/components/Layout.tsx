import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, ArrowLeft, CalendarRange, PanelRightClose } from "lucide-react"; // Nuevos iconos
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { useUiStore } from "@/stores";
import { useIsLargeScreen } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";
import { CampaignTimeline } from "./CampaignTimeline"; // Asegúrate de importar esto

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { projects, campaigns, currentCampaign, setCurrentCampaign, currentProjectId, montes, isTrialMode } = useApp();
  const { setCurrentCampaign: setStoreCurrentCampaign, setActiveCampaign } = useUiStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isProjectsPage = location.pathname === '/projects';
  
  // Lógica de visualización del Timeline
  // 1. Rutas permitidas (ajusta los strings según tus rutas reales)
  const timelineAllowedRoutes = ['/costos', '/inversiones', '/montes', '/produccion'];
  
  // 2. ¿Debemos renderizar el timeline en esta página?
  const showTimelineContext = timelineAllowedRoutes.some(route => location.pathname.includes(route));

  // 3. Estado de apertura del timeline (por defecto abierto si es pantalla grande)
  const [isTimelineOpen, setIsTimelineOpen] = useState(true);

  // Layout Sidebar lógica
  const isLargeScreen = useIsLargeScreen();
  const [sidebarOpen, setSidebarOpen] = useState(isLargeScreen);

  useEffect(() => {
    setSidebarOpen(isLargeScreen);
  }, [isLargeScreen]);

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
      style={{
        "--sidebar-width": "16rem",
        "--sidebar-width-mobile": "18rem",
      } as React.CSSProperties}
    >
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
       
        <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out h-screen overflow-hidden">
          {/* HEADER */}
          <header className="h-16 flex items-center justify-between px-6 border-b border-border/40 bg-card/50 backdrop-blur-sm shadow-sm sticky top-0 z-20 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-foreground" />
              
              {!isProjectsPage && (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Proyecto:</span>
                    <span className="text-sm font-semibold text-foreground truncate max-w-[150px]">
                       {projects.find(p => p.id === currentProjectId)?.project_name || "Sin proyecto"}
                    </span>
                  </div>

                  {/* Selector clásico (Visible solo si el Timeline está cerrado o en móvil, opcional) */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Campaña:</span>
                    <Select
                      value={currentCampaign.toString()}
                      onValueChange={(value) => handleCampaignChange(parseInt(value))}
                    >
                      <SelectTrigger className="w-[120px] bg-cream/50">
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.filter(c => c && c.year).map((campaign) => (
                          <SelectItem key={campaign.id} value={campaign.year.toString()}>
                            {campaign.year}
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

              {/* Botón Toggle Timeline (Solo visible en páginas permitidas) */}
              {showTimelineContext && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsTimelineOpen(!isTimelineOpen)}
                  title={isTimelineOpen ? "Ocultar línea de tiempo" : "Mostrar línea de tiempo"}
                  className={isTimelineOpen ? "bg-accent/50 text-accent-foreground" : "text-muted-foreground"}
                >
                  {isTimelineOpen ? <PanelRightClose className="h-5 w-5" /> : <CalendarRange className="h-5 w-5" />}
                </Button>
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
            <div className="bg-yellow-100 border-b border-yellow-200 px-6 py-1 text-center shrink-0">
              <p className="text-yellow-800 text-xs sm:text-sm mb-0">
                <strong>Modo Prueba</strong> <a href="https://forms.gle/hcgwjZAgLoMjATcFA" target="_blank" rel="noopener noreferrer" className="underline font-semibold ml-2">HACERME SOCIO</a>
              </p>
            </div>
          )}

          {/* MAIN CONTENT AREA CON TIMELINE */}
          <div className="flex flex-1 overflow-hidden relative">
            
            {/* Contenido Principal */}
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
               {children}
            </main>

            {/* TIMELINE LATERAL FIJO */}
            {showTimelineContext && (
              <aside 
                className={`
                  border-none bg-transparent backdrop-blur-sm
                  transition-all duration-300 ease-in-out flex flex-col
                  ${isTimelineOpen ? "w-20 opacity-100 translate-x-0" : "w-0 opacity-0 translate-x-10 overflow-hidden border-none"}
                `}
              >
                <div className="h-full py-2">
                   <CampaignTimeline />
                </div>
              </aside>
            )}

          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}