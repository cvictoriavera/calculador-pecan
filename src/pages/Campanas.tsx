import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency } from "@/lib/calculations";
import { useCalculationsStore } from "@/stores/calculationsStore";
import { createCampaign } from "@/services/campaignService";
import { useToast } from "@/components/ui/use-toast";
import { RegistrarProduccionForm } from "@/components/produccion/forms/RegistrarProduccionForm";
import { EditarProduccionForm } from "@/components/produccion/forms/EditarProduccionForm";
import { useDataStore } from "@/stores/dataStore";
import AddCostoSheet from "@/components/costos/AddCostoSheet";
import AddInversionSheet from "@/components/inversiones/AddInversionSheet";
import { createInvestment, updateInvestment as updateInvestmentApi } from "@/services/investmentService";

const categoriaLabels: Record<string, string> = {
  tierra: "Tierra",
  mejoras: "Mejoras",
  implantacion: "Implantación",
  riego: "Riego",
  maquinaria: "Maquinaria",
};

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

  const { initialYear, currentCampaign, currentProjectId, campaigns, campaignsLoading, loadCampaigns, updateCampaign, setCurrentCampaign, currentCampaignId, montes } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getTotalCostsByCampaign, getTotalInvestmentsByCampaign } = useCalculationsStore();
  const productions = useDataStore((state) => state.productions);
  const productionCampaigns = useDataStore((state) => state.productionCampaigns);
  const addProduction = useDataStore((state) => state.addProduction);
  const addProductionCampaign = useDataStore((state) => state.addProductionCampaign);
  const updateProductionCampaign = useDataStore((state) => state.updateProductionCampaign);
  const deleteProduction = useDataStore((state) => state.deleteProduction);
  const costs = useDataStore((state) => state.costs);
  const addCost = useDataStore((state) => state.addCost);
  const updateCost = useDataStore((state) => state.updateCost);
  const investments = useDataStore((state) => state.investments);
  const addInvestment = useDataStore((state) => state.addInvestment);
  const updateInvestment = useDataStore((state) => state.updateInvestment);
  const [isCreating, setIsCreating] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [costoSheetOpen, setCostoSheetOpen] = useState(false);
  const [editingCosto, setEditingCosto] = useState<any>(null);
  const [inversionSheetOpen, setInversionSheetOpen] = useState(false);
  const [editingInversion, setEditingInversion] = useState<any>(null);


  
  const handleNuevaCampana = async () => {
    // Activamos el modo carga inmediatamente
    setIsCreating(true);

    const nextYear = currentCampaign + 1;
    
    // ... validación de existente ...
    const existing = safeCampaigns.find(c => c.year === nextYear);
    if (existing) {
      toast({
        title: "Error",
        description: `Ya existe una campaña para el año ${nextYear}`,
        variant: "destructive",
      });
      setIsCreating(false); // Importante: desactivar si hay error temprano
      return;
    }

    try {
      // 1. Cerrar campañas anteriores
      for (const camp of safeCampaigns) {
        if (camp.status !== 'closed' || camp.is_current !== 0) {
          await updateCampaign(camp.id, { status: 'closed', is_current: 0 });
        }
      }

      // 2. Crear la nueva campaña
      await createCampaign({
        project_id: currentProjectId!,
        campaign_name: `Campaña ${nextYear}`,
        year: nextYear,
        start_date: `${nextYear}-01-01`,
        end_date: undefined,
        status: 'open',
        is_current: 1,
      });

      toast({
        title: "Éxito",
        description: `Campaña ${nextYear} creada exitosamente`,
      });

      // 3. Recargar datos (Esperamos a que termine)
      await loadCampaigns();
      
      // 4. Cambiar el año actual
      setCurrentCampaign(nextYear);

    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la campaña",
        variant: "destructive",
      });
    } finally {
      // 5. Desactivar carga SIEMPRE (haya éxito o error)
      setIsCreating(false);
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

  const handleSaveProduccion = async (data: any) => {
    try {
      // Calculate total production
      const totalKg = data.produccionPorMonte.reduce((acc: number, p: any) => acc + p.kgRecolectados, 0);

      // Update local Zustand stores
      // Remove existing records for current campaign
      productions.filter((p) => p.year === currentCampaign).forEach((p) => deleteProduction(p.id));

      // Add new production records
      data.produccionPorMonte.forEach((p: any) => {
        addProduction({
          id: `${currentCampaign}-${p.monteId}`,
          year: currentCampaign,
          monteId: p.monteId,
          kgHarvested: p.kgRecolectados,
          date: new Date(),
        });
      });

      // Prepare montes data for DB (IDs de los que aportaron algo)
      const montesContribuyentes = (data as any).produccionPorMonte
        .filter((p: any) => p.kgRecolectados > 0)
        .map((p: any) => p.monteId);
      
      // 1. CREAMOS EL DICCIONARIO DE PRODUCCIÓN (ID: Kilos)
      const produccionDiccionario = (data as any).produccionPorMonte.reduce((acc: any, p: any) => {
        if (p.kgRecolectados > 0) acc[p.monteId] = p.kgRecolectados;
        return acc;
      }, {});

      // 2. CREAMOS EL OBJETO ESTRUCTURADO CON METADATOS
      // Aquí guardamos el método ("total" o "detallado") para respetarlo al editar
      const montesProductionJSON = {
        metodo: data.metodo,
        distribucion: produccionDiccionario
      };

      // Update campaign in database
      if (currentCampaignId) {
        await updateCampaign(currentCampaignId, {
          average_price: data.precioPromedio,
          total_production: totalKg,
          montes_contribuyentes: JSON.stringify(montesContribuyentes),
          // Guardamos la nueva estructura JSON
          montes_production: JSON.stringify(montesProductionJSON),
        });
        console.log('Campaign updated with method:', data.metodo);
        // Reload campaigns to reflect changes
        await loadCampaigns();
      } else {
         console.log('No currentCampaignId, skipping DB update');
      }

      // Update local productionCampaigns
      const existingCampaign = productionCampaigns.find(pc => pc.year === currentCampaign);
      if (existingCampaign) {
        updateProductionCampaign(existingCampaign.id, {
          averagePrice: data.precioPromedio,
          totalProduction: totalKg,
          date: new Date(),
        });
      } else {
        addProductionCampaign({
          id: `campaign-${currentCampaign}`,
          year: currentCampaign,
          averagePrice: data.precioPromedio,
          totalProduction: totalKg,
          date: new Date(),
        });
      }

      setEditingData(null);
      setWizardOpen(false);
      setEditData(null);
      setEditOpen(false);
    } catch (error) {
      console.error('Error saving production:', error);
      // TODO: Show error message to user
    }
  };

  const handleUpdateCosto = async (categoriaOrData: string | any, formData?: any) => {
    if (!currentProjectId) {
      toast({
        title: "Error",
        description: "No hay proyecto activo",
        variant: "destructive",
      });
      return;
    }

    if (!currentCampaignId) {
      toast({
        title: "Error",
        description: "No se pudo encontrar la campaña actual",
        variant: "destructive",
      });
      return;
    }

    try {
      if (typeof categoriaOrData === 'object' && categoriaOrData.category) {
        const costData = categoriaOrData;
        if (costData.existingId) {
          await updateCost(costData.existingId, {
            category: costData.category,
            details: costData.details,
            total_amount: costData.total_amount,
          });
          toast({
            title: "Éxito",
            description: "Costo actualizado",
          });
        } else {
          await addCost({
            project_id: currentProjectId,
            campaign_id: currentCampaignId,
            category: costData.category,
            details: costData.details,
            total_amount: costData.total_amount,
          });
          toast({
            title: "Éxito",
            description: "Costo registrado",
          });
        }
      }
      else if (typeof formData === 'object' && formData.category) {
         if (formData.existingId) {
          await updateCost(formData.existingId, {
            category: formData.category,
            details: formData.details,
            total_amount: formData.total_amount,
          });
          toast({
            title: "Éxito",
            description: "Costo actualizado",
          });
        } else {
          await addCost({
            project_id: currentProjectId,
            campaign_id: currentCampaignId,
            category: formData.category,
            details: formData.details,
            total_amount: formData.total_amount,
          });
          toast({
            title: "Éxito",
            description: "Costo registrado",
          });
        }
      }
      else if (editingCosto) {
        const categoria = categoriaOrData as string;
        await updateCost(editingCosto.id, {
          category: categoria,
          details: formData,
          total_amount: formData?.total || formData?.total_amount || 0,
        });
        toast({
          title: "Éxito",
          description: "Costo actualizado",
        });
        setEditingCosto(null);
      }
      else {
        const categoria = categoriaOrData as string;
        await addCost({
          project_id: currentProjectId,
          campaign_id: currentCampaignId,
          category: categoria,
          details: formData,
          total_amount: formData?.total || formData?.total_amount || 0,
        });
        toast({
          title: "Éxito",
          description: "Costo registrado",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar el costo",
        variant: "destructive",
      });
      console.error("Error saving cost:", error);
    }
  };

  const handleSaveInversion = async (categoria: string, data: any) => {
    if (!currentProjectId) {
      toast({
        title: "Error",
        description: "No hay proyecto activo",
        variant: "destructive",
      });
      return;
    }

    const categoriaLabel = categoriaLabels[categoria];
    const descripcion = data.descripcion || data.items?.map((i: any) => i.tipo).join(", ") || categoriaLabel;
    const monto = Number(data.total || data.precio || 0);

    try {
      if (editingInversion) {
        await updateInvestmentApi(parseInt(editingInversion.id), {
          category: categoria,
          description: descripcion,
          total_value: monto,
          details: data,
        });
        updateInvestment(editingInversion.id, {
          category: categoria,
          description: descripcion,
          amount: monto,
          data,
        });
        toast({
          title: "Éxito",
          description: "Inversión actualizada correctamente",
        });
        setEditingInversion(null);
      } else {
        const result = await createInvestment({
          project_id: currentProjectId,
          campaign_id: currentCampaignId as number,
          category: categoria,
          description: descripcion,
          total_value: monto,
          details: data,
        });
        addInvestment({
          id: result.id.toString(),
          campaign_id: currentCampaignId as number,
          category: categoria,
          description: descripcion,
          amount: monto,
          date: new Date(),
          data,
        });
        toast({
          title: "Éxito",
          description: "Inversión registrada correctamente",
        });
      }
    } catch (error) {
      console.error("Error saving investment:", error);
      toast({
        title: "Error",
        description: "Error al guardar la inversión",
        variant: "destructive",
      });
    }
  };

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
        <Button 
          onClick={handleNuevaCampana} 
          disabled={isCreating} // Deshabilita el botón mientras crea
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Creando...
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              Nueva Campaña
            </>
          )}
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
                            return formatCurrency(total, true);
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        const hasProduction = campaign && parseFloat(campaign.total_production || '0') > 0;
                        setCurrentCampaign(year);
                        if (hasProduction) {
                          // Prepare editing data
                          const campana = campaign;
                          const totalProduccionRegistrada = campana?.total_production ? Number(campana.total_production) : 0;
                          let prodByMonte: Record<string, number> = {};
                          let metodoDetectado: "detallado" | "total" = "detallado";

                          if (campana && (campana as any).montes_production) {
                            try {
                              const rawData = (campana as any).montes_production;
                              let parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
                              if (parsedData && typeof parsedData === 'object' && parsedData.metodo) {
                                metodoDetectado = parsedData.metodo;
                                prodByMonte = parsedData.distribucion || {};
                              } else {
                                metodoDetectado = "detallado";
                                prodByMonte = parsedData;
                              }
                            } catch (e) {
                              console.error("Error parseando JSON de producción:", e);
                            }
                          } else if (campana && (campana as any).montes_contribuyentes && totalProduccionRegistrada > 0) {
                            metodoDetectado = "total";
                            try {
                              const rawContrib = (campana as any).montes_contribuyentes;
                              const idsContribuyentes: string[] = (typeof rawContrib === 'string' ? JSON.parse(rawContrib) : rawContrib).map(String);
                              const montesQueAportaron = montes.filter(m => idsContribuyentes.includes(String(m.id)));
                              const totalHectareas = montesQueAportaron.reduce((sum, m) => sum + m.hectareas, 0);
                              if (totalHectareas > 0) {
                                const rendimientoPromedio = totalProduccionRegistrada / totalHectareas;
                                montesQueAportaron.forEach(m => {
                                  prodByMonte[String(m.id)] = Math.round(m.hectareas * rendimientoPromedio);
                                });
                              }
                            } catch (e) {
                              console.error("Error recalculando distribución proporcional:", e);
                            }
                          }

                          const montesDisponibles = montes
                            .filter((m) => m.añoPlantacion <= year)
                            .map((m) => ({
                              ...m,
                              edad: Number(year) - Number(m.añoPlantacion),
                            }));

                          const produccionPorMonte = montesDisponibles.map(monte => ({
                            monteId: monte.id,
                            nombre: monte.nombre,
                            hectareas: monte.hectareas,
                            edad: monte.edad,
                            kgRecolectados: prodByMonte[String(monte.id)] || 0,
                          }));

                          setEditData({
                            precioPromedio: campana?.average_price ? Number(campana.average_price) : 0,
                            metodo: metodoDetectado,
                            produccionPorMonte,
                          });
                          setEditOpen(true);
                        } else {
                          setWizardOpen(true);
                        }
                      }}
                    >
                      {campaign && parseFloat(campaign.total_production || '0') > 0 ? 'Editar Producción' : 'Cargar Producción'}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setCurrentCampaign(year);
                        setCostoSheetOpen(true);
                      }}
                    >
                      {campaign && getTotalCostsByCampaign(campaign.id) > 0 ? 'Editar Costos' : 'Registrar Costos'}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setCurrentCampaign(year);
                        if (campaign && investments.filter(inv => inv.campaign_id === campaign.id).length > 0) {
                          navigate('/inversiones');
                        } else {
                          setInversionSheetOpen(true);
                        }
                      }}
                    >
                      {campaign && investments.filter(inv => inv.campaign_id === campaign.id).length > 0 ? 'Ver Inversiones' : 'Registrar Inversiones'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <RegistrarProduccionForm
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSave={handleSaveProduccion}
        editingData={editingData}
      />

      <EditarProduccionForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleSaveProduccion}
        editingData={editData}
      />

      <AddCostoSheet
        open={costoSheetOpen}
        onOpenChange={(open) => {
          setCostoSheetOpen(open);
          if (!open) setEditingCosto(null);
        }}
        onSave={handleUpdateCosto}
        editingCosto={editingCosto}
        existingCosts={costs.filter((c: any) => String(c.campaign_id) === String(currentCampaignId))}
      />

      <AddInversionSheet
        open={inversionSheetOpen}
        onOpenChange={(open) => {
          setInversionSheetOpen(open);
          if (!open) setEditingInversion(null);
        }}
        onSave={handleSaveInversion}
        editingInversion={editingInversion}
      />
    </div>
  );
};

export default Campanas;
