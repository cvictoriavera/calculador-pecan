import { Home, Sprout, CalendarRange, DollarSign, Settings, TrendingUp, Package, ArrowLeft, HelpCircle, BarChart3, Table2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
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
import { useApp } from "@/contexts/AppContext";
import { useMemo } from "react";

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

const statisticalMenuItems = [
  { title: "Resumen ejecutivo", url: "/resumen-ejecutivo", icon: BarChart3 },
  { title: "Indicadores", url: "/indicadores", icon: Table2, adminOnly: true },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { isAdmin } = useApp();
  const location = useLocation();
  const isGlobalPage = ['/projects', '/resumen-ejecutivo', '/indicadores'].includes(location.pathname);
  const menuItems = isGlobalPage ? projectsMenuItems : projectMenuItems;

  const visibleStatisticalMenuItems = useMemo(() => {
    return statisticalMenuItems.filter(item => !item.adminOnly || isAdmin);
  }, [isAdmin]);

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

        {/* Menú Principal */}
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

        {/* Panel Estadístico */}
        {visibleStatisticalMenuItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/70">Panel Estadístico</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleStatisticalMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="hover:bg-sidebar-accent transition-colors no-underline"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold no-underline"
                      >
                        <item.icon className="h-5 w-5" />
                        {open && (
                          <div className="flex items-center justify-between w-full ml-3">
                            <span>{item.title}</span>
                            {item.adminOnly && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold border border-primary/20">
                                Admin
                              </span>
                            )}
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Footer */}
        <div className="mt-auto p-3 border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                {isGlobalPage ? (
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
