import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency } from "@/lib/calculations";
import { useCalculationsStore } from "@/stores/calculationsStore";
import { useDataStore } from "@/stores";
import { createCampaign } from "@/services/campaignService";
import { useToast } from "@/components/ui/use-toast";


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
  notes?: string;
  average_price?: string;
  total_production?: string;
  montes_contribuyentes?: string;
  montes_production?: string;
}

const Campanas = () => {

  const { initialYear, currentCampaign, currentProjectId, campaigns, campaignsLoading, loadCampaigns, updateCampaign, setCurrentCampaign } = useApp();

  const { toast } = useToast();

  const { getTotalCostsByCampaign, getTotalInvestmentsByCampaign } = useCalculationsStore();

  const { costs, investments } = useDataStore();

  useEffect(() => {
    console.log(`Datos: ${costs.length} costos, ${investments.length} inversiones`);
    investments.forEach(inv => {
      console.log(`Inversión: ID=${inv.id}, campaign_id=${inv.campaign_id}, amount=${inv.amount}`);
    });
  }, [costs, investments]);

  const handleNuevaCampana = async () => {
    const nextYear = currentCampaign + 1;
    const existing = safeCampaigns.find(c => c.year === nextYear);
    if (existing) {
      toast({
        title: "Error",
        description: `Ya existe una campaña para el año ${nextYear}`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Close all other campaigns and set is_current to 0
      for (const camp of safeCampaigns) {
        if (camp.status !== 'closed' || camp.is_current !== 0) {
          await updateCampaign(camp.id, { status: 'closed', is_current: 0 });
        }
      }

      // Create the new campaign as open and current
      await createCampaign({
        project_id: currentProjectId!,
        campaign_name: `Campaña ${nextYear}`,
        year: nextYear,
        start_date: `${nextYear}-01-01`,
        end_date: undefined,
        status: 'open',
        is_current: 1,
      });

      // Update the current campaign year
      setCurrentCampaign(nextYear);

      toast({
        title: "Éxito",
        description: `Campaña ${nextYear} creada exitosamente`,
      });
      // Reload campaigns
      await loadCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la campaña",
        variant: "destructive",
      });
    }
  };

  // Ensure campaigns is always an array
  const safeCampaigns = campaigns || [];


  // Get campaign data for a specific year
  const getCampaignForYear = (year: number): Campaign | null => {
    return safeCampaigns.find(campaign => String(campaign.year) === String(year)) || null;
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
        <Button onClick={handleNuevaCampana} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
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

             console.log(`Renderizando campaña ${year}: campaign=${campaign ? `ID=${campaign.id}` : 'null'}`);

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
                      <Badge variant="outline">Sin datos</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                        <p className="text-lg font-semibold text-foreground">{campaign ? (parseFloat(campaign.total_production || '0')).toLocaleString() + ' kg' : '0 kg'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-secondary">
                        <TrendingUp className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ingresos</p>
                        <p className="text-lg font-semibold text-accent">{campaign ? formatCurrency((parseFloat(campaign.total_production || '0')) * (parseFloat(campaign.average_price || '0')), true) : '$0'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-secondary">
                        <TrendingUp className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Costos</p>
                        <p className="text-lg font-semibold text-accent"> {campaign ? formatCurrency(getTotalCostsByCampaign(campaign.id), true) : '$0'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-secondary">
                        <TrendingUp className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Invertido</p>
                        <p className="text-lg font-semibold text-accent">
                          {(() => {
                            const total = campaign ? getTotalInvestmentsByCampaign(campaign.id) : 0;
                            console.log(`Campaña ${campaign?.id}: Total inversiones = ${total}`);
                            return formatCurrency(total, true);
                          })()}
                        </p>
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
