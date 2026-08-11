import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Montes from "./pages/Montes";
import Campanas from "./pages/Campanas";
import Produccion from "./pages/Produccion";
import Inversiones from "./pages/Inversiones";
import Costos from "./pages/Costos";
import Config from "./pages/Config";
import Onboarding from "./pages/Onboarding";
import Projects from "./pages/Projects";
import PanelEstadistico from "./pages/PanelEstadistico";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const FallbackLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Cargando...</p>
    </div>
  </div>
);

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useApp();

  if (isLoading) return <FallbackLoader />;

  const isAdmin = Boolean(
    user?.roles?.includes('administrator') || user?.roles?.includes('admin')
  );

  if (!isAdmin) {
    return <Navigate to="/projects" replace />;
  }

  return children;
};

const LayoutRoute = () => (
  <Layout>
    <Outlet />
  </Layout>
);

function AppRouter() {
  const { isOnboardingComplete, isLoading, isLoggingOut, isChangingProject } = useApp();

  if (isLoading || isLoggingOut || isChangingProject) return <FallbackLoader />;

  if (!isOnboardingComplete) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Layout><Onboarding /></Layout>} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/projects" replace />} />
      <Route element={<LayoutRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/montes" element={<Montes />} />
        <Route path="/campanas" element={<Campanas />} />
        <Route path="/produccion" element={<Produccion />} />
        <Route path="/inversiones" element={<Inversiones />} />
        <Route path="/costos" element={<Costos />} />
        <Route path="/config" element={<Config />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/panel-estadistico" element={<AdminRoute><PanelEstadistico /></AdminRoute>} />
      </Route>
      <Route path="/calculador-pecan/panel-estadistico" element={<Navigate to="/panel-estadistico" replace />} />
      <Route path="/onboarding" element={<Navigate to="/projects" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <AppRouter />
        </HashRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
