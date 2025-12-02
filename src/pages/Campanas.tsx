import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";

interface Campaign {
  id: number;
  project_id: number;
  campaign_name: string;
  year: number;
  start_date: string;
  end_date: string | null;
  status: 'open' | 'closed' | 'archived';
  is_current: number;
  created_at: string;
  updated_at: string;
}

const Campanas = () => {
  const { initialYear, currentCampaign, currentProjectId, campaigns, campaignsLoading } = useApp();

  // Ensure campaigns is always an array
  const safeCampaigns = campaigns || [];


  // Get campaign data for a specific year
  const getCampaignForYear = (year: number): Campaign | null => {
    return safeCampaigns.find(campaign => campaign.year === year) || null;
  };

  // Generate years from current year down to initial year
  const generateCampaignYears = () => {
    if (!initialYear) return [];

    const years = [];
    for (let year = currentCampaign; year >= initialYear; year--) {
      years.push(year);
    }
    return years;
  };

  const campaignYears = generateCampaignYears();
  if (!initialYear) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Campañas</h1>
            <p className="text-muted-foreground">Gestión de ciclos anuales de Producción</p>
          </div>
        </div>
        <Card className="border-border/50 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Configuración incompleta</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Debes completar la configuración inicial para ver las campañas
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Campañas</h1>
          <p className="text-muted-foreground">Gestión de ciclos anuales de producción</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="h-5 w-5" />
          Nueva Campaña
        </Button>
      </div>

      {!currentProjectId ? (
        <Card className="border-border/50 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Proyecto no configurado</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Debes completar la configuración inicial del proyecto para ver las campañas
            </p>
          </CardContent>
        </Card>
      ) : campaignsLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Cargando campañas...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {campaignYears.map((year) => {
            const campaign = getCampaignForYear(year);
            const isCurrentYear = year === currentCampaign;

            return (
              <Card
                key={year}
                className="border-border/50 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl font-bold text-foreground">
                        Campaña {year}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {campaign
                          ? `${new Date(campaign.start_date).toLocaleDateString("es-AR")} - ${campaign.end_date ? new Date(campaign.end_date).toLocaleDateString("es-AR") : "En curso"}`
                          : `${year}-01-01 - ${year}-12-31`
                        }
                      </p>
                    </div>
                    {campaign ? (
                      campaign.status === 'open' ? (
                        <Badge className="bg-accent text-accent-foreground">
                          {isCurrentYear ? 'Activa' : 'Abierta'}
                        </Badge>
                      ) : campaign.status === 'closed' ? (
                        <Badge variant="secondary">Cerrada</Badge>
                      ) : (
                        <Badge variant="outline">Archivada</Badge>
                      )
                    ) : (
                      <Badge variant="outline">No creada</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {campaign ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-secondary">
                            <Calendar className="h-6 w-6 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Duración</p>
                            <p className="text-lg font-semibold text-foreground">12 meses</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-secondary">
                            <TrendingUp className="h-6 w-6 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Producción</p>
                            <p className="text-lg font-semibold text-foreground">0 kg</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-secondary">
                            <TrendingUp className="h-6 w-6 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Ingresos</p>
                            <p className="text-lg font-semibold text-accent">$0</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border flex gap-2">
                        <Button variant="outline" className="flex-1">
                          Ver Producción
                        </Button>
                        <Button variant="outline" className="flex-1">
                          Ver Costos
                        </Button>
                        <Button variant="outline" className="flex-1">
                          Ver Inversiones
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Campaña {year} no creada
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Esta campaña aún no ha sido configurada en el sistema
                      </p>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        Crear Campaña {year}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Campanas;
