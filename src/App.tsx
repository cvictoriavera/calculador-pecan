import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Montes from "./pages/Montes";
import Campanas from "./pages/Campanas";
import Inversiones from "./pages/Inversiones";
import Costos from "./pages/Costos";
import Config from "./pages/Config";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { isOnboardingComplete, isLoading, currentProjectId } = useApp();

  console.log('ProtectedRoutes: isLoading:', isLoading, 'isOnboardingComplete:', isOnboardingComplete, 'currentProjectId:', currentProjectId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isOnboardingComplete) {
    console.log('Redirecting to onboarding');
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
          />
          <Route
            path="/montes"
            element={
              <Layout>
                <Montes />
              </Layout>
            }
          />
          <Route
            path="/campanas"
            element={
              <Layout>
                <Campanas />
              </Layout>
            }
          />
          <Route
            path="/inversiones"
            element={
              <Layout>
                <Inversiones />
              </Layout>
            }
          />
          <Route
            path="/costos"
            element={
              <Layout>
                <Costos />
              </Layout>
            }
          />
          <Route
            path="/config"
            element={
              <Layout>
                <Config />
              </Layout>
            }
          />
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
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
