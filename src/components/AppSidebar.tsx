import { Home, Sprout, CalendarRange, DollarSign, Settings, TrendingUp, Package, ArrowLeft, HelpCircle, BarChart3, Layers, Globe, History } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useLocation } from "react-router-dom";

const projectMenuItems = [
  { title: "Inicio", url: "/dashboard", icon: Home },
  { title: "Mis Montes", url: "/montes", icon: Sprout },
  { title: "Campañas", url: "/campanas", icon: CalendarRange },
  { title: "Producción", url: "/produccion", icon: Package },
  { title: "Inversiones", url: "/inversiones", icon: DollarSign },
  { title: "Costos Operativos", url: "/costos", icon: TrendingUp },
  { title: "Configuración", url: "/config", icon: Settings },
];

const projectsMenuItems = [
  { title: "Mis Proyectos", url: "/projects", icon: Package },
];

const adminMenuItems = [
  { title: "Resumen Ejecutivo", url: "/analisis-estadistico?tab=resumen", tab: "resumen", icon: BarChart3 },
  { title: "Análisis Interno", url: "/analisis-estadistico?tab=interno", tab: "interno", icon: Layers },
  { title: "Benchmarking Internacional", url: "/analisis-estadistico?tab=benchmarking", tab: "benchmarking", icon: Globe },
  { title: "Evolución Histórica", url: "/analisis-estadistico?tab=evolucion", tab: "evolucion", icon: History },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { user } = useApp();
  const isProjectsPage = location.pathname === '/projects' || location.pathname === '/analisis-estadistico';
  const menuItems = isProjectsPage ? projectsMenuItems : projectMenuItems;
  const isAdmin = user?.roles?.includes('administrator') || false;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full bg-sidebar">
        <div className="p-3 border-b border-sidebar-border">
          {open && (
            <div className="flex items-center gap-2">
              <Sprout className="h-8 w-8 text-sidebar-primary" />
              <div>
                <h1 className="text-lg m-0 text-sidebar-foreground">CalculadorPecan</h1>
                <p className="text-xs m-0 text-sidebar-foreground/70">Gestión Cultivo de Pecán</p>
              </div>
            </div>
          )}
          {!open && <Sprout className="h-6 w-6 text-sidebar-primary mx-auto" />}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent transition-colors no-underline"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold no-underline"
                    >
                      <item.icon className="h-5 w-5" />
                      {open && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isProjectsPage && isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/70">Análisis Estadístico</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => {
                  const isActive = location.pathname === '/analisis-estadistico' &&
                    (new URLSearchParams(location.search).get('tab') || 'resumen') === item.tab;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link
                          to={item.url}
                          className={`hover:bg-sidebar-accent transition-colors no-underline ${isActive ? "bg-sidebar-accent text-sidebar-primary font-semibold" : ""
                            }`}
                        >
                          <item.icon className="h-5 w-5" />
                          {open && <span className="ml-3">{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <div className="mt-auto p-3 border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                {isProjectsPage ? (
                  <button
                    className="hover:bg-sidebar-accent transition-colors no-underline w-full text-left"
                  >
                    <HelpCircle className="h-5 w-5" />
                    {open && <span className="ml-3"><a href="mailto:asistenciausuariocapp@gmail.com"> Ayuda / Soporte </a></span>}
                  </button>
                ) : (
                  <NavLink
                    to="/projects"
                    className="hover:bg-sidebar-accent transition-colors no-underline"
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold no-underline"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    {open && <span className="ml-3">Volver a Mis Proyectos</span>}
                  </NavLink>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
