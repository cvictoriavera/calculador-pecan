import { Home, Sprout, CalendarRange, DollarSign, Settings, TrendingUp, Package, ArrowLeft } from "lucide-react";
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

const menuItems = [
  { title: "Inicio", url: "/", icon: Home },
  { title: "Mis Montes", url: "/montes", icon: Sprout },
  { title: "Campañas", url: "/campanas", icon: CalendarRange },
  { title: "Producción", url: "/produccion", icon: Package },
  { title: "Inversiones", url: "/inversiones", icon: DollarSign },
  { title: "Costos Operativos", url: "/costos", icon: TrendingUp },
  { title: "Configuración", url: "/config", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full bg-sidebar">
        <div className="p-3 border-b border-sidebar-border">
          {open && (
            <div className="flex items-center gap-2">
              <Sprout className="h-8 w-8 text-sidebar-primary" />
              <div>
                <h1 className="text-lg m-0 text-sidebar-foreground">PecanManager</h1>
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
                      end={item.url === "/"}
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

        <div className="mt-auto p-3 border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to="/projects"
                  className="hover:bg-sidebar-accent transition-colors no-underline"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold no-underline"
                >
                  <ArrowLeft className="h-5 w-5" />
                  {open && <span className="ml-3">Volver a Mis Proyectos</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
