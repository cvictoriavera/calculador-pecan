import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Sprout, AlertTriangle, CheckCircle } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { getMontesByProject } from "@/services/monteService";
import { getCampaignsByProject } from "@/services/campaignService";

interface ProjectHealth {
  id: number;
  project_name: string;
  location: string;
  campaignsCount: number;
  totalArea: number;
  status: 'active' | 'inactive';
  alerts: string[];
}

const Projects = () => {
  const { projects, projectsLoading, changeProject } = useApp();
  const navigate = useNavigate();
  const [projectsHealth, setProjectsHealth] = useState<ProjectHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjectsHealth = async () => {
      if (!projects.length) {
        setLoading(false);
        return;
      }

      const healthData: ProjectHealth[] = [];

      for (const project of projects) {
        try {
          // Load montes to get total area
          const montes = await getMontesByProject(project.id);
          const totalArea = montes ? montes.reduce((sum, monte) => sum + parseFloat(monte.area_hectareas || '0'), 0) : 0;

          // Load campaigns
          const campaigns = await getCampaignsByProject(project.id);
          const campaignsCount = campaigns ? campaigns.length : 0;

          // Build location string
          const locationParts = [project.municipio, project.departamento, project.provincia, project.pais].filter(Boolean);
          const location = locationParts.join(', ');

          // For now, simple alerts - can be expanded
          const alerts: string[] = [];
          if (campaignsCount === 0) alerts.push('Sin campañas activas');
          if (totalArea === 0) alerts.push('Sin montes registrados');

          healthData.push({
            id: project.id,
            project_name: project.project_name,
            location,
            campaignsCount,
            totalArea,
            status: project.status === 'active' ? 'active' : 'inactive',
            alerts
          });
        } catch (error) {
          console.error(`Error loading health data for project ${project.id}:`, error);
          // Add with minimal data
          healthData.push({
            id: project.id,
            project_name: project.project_name,
            location: '',
            campaignsCount: 0,
            totalArea: 0,
            status: 'inactive',
            alerts: ['Error al cargar datos']
          });
        }
      }

      setProjectsHealth(healthData);
      setLoading(false);
    };

    loadProjectsHealth();
  }, [projects]);

  const handleSelectProject = async (projectId: number) => {
    try {
      await changeProject(projectId);
      // Store as last project
      localStorage.setItem('lastProjectId', projectId.toString());
      navigate('/');
    } catch (error) {
      console.error('Error changing project:', error);
    }
  };

  if (loading || projectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl ">Mis Proyectos</h1>
          <p className="text-muted-foreground">Selecciona un proyecto para continuar</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projectsHealth.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleSelectProject(project.id)}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-1">{project.project_name}</CardTitle>
                  {project.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      {project.location}
                    </div>
                  )}
                </div>
                <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                  {project.status === 'active' ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{project.campaignsCount} campañas</span>
                </div>
                <div className="flex items-center">
                  <Sprout className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{project.totalArea.toFixed(1)} ha</span>
                </div>
              </div>

              {project.alerts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center text-sm font-medium text-amber-600">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Alertas
                  </div>
                  <ul className="space-y-1">
                    {project.alerts.map((alert, index) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-center">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2"></span>
                        {alert}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {project.alerts.length === 0 && (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Todo en orden
                </div>
              )}

              <Button className="w-full mt-4" onClick={(e) => { e.stopPropagation(); handleSelectProject(project.id); }}>
                Seguir trabajando
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {projectsHealth.length === 0 && (
        <div className="text-center py-12">
          <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No tienes proyectos</h3>
          <p className="text-muted-foreground mb-4">Crea tu primer proyecto para comenzar</p>
          <Button>Crear Proyecto</Button>
        </div>
      )}
    </div>
  );
};

export default Projects;