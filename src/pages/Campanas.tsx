import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency } from "@/lib/calculations";
import { useCalculationsStore } from "@/stores/calculationsStore";
import { createCampaign, closeActiveCampaign } from "@/services/campaignService";
import { useToast } from "@/components/ui/use-toast";
import { RegistrarProduccionForm } from "@/components/produccion/forms/RegistrarProduccionForm";
import { EditarProduccionForm } from "@/components/produccion/forms/EditarProduccionForm";
import { useDataStore } from "@/stores/dataStore";
import AddCostoSheet from "@/components/costos/AddCostoSheet";
import AddInversionSheet from "@/components/inversiones/AddInversionSheet";
import { createInvestment, updateInvestment as updateInvestmentApi } from "@/services/investmentService";
import { createProductionsByCampaign, getProductionsByCampaign } from "@/services/productionService";

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

  const { getTotalCostsByCampaign, getTotalInvestmentsByCampaign, getTotalProductionByCampaign } = useCalculationsStore();
  const loadAllProductions = useDataStore((state) => state.loadAllProductions);
  
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


  useEffect(() => {
    if (campaigns && campaigns.length > 0) {
      loadAllProductions(campaigns);
    }
  }, [campaigns, loadAllProductions]);
  
  const handleNuevaCampana = async () => {
    // Activamos el modo carga inmediatamente
    setIsCreating(true);

    // Encontrar el año más alto entre todas las campañas existentes
    const maxYear = safeCampaigns.length > 0 ? Math.max(...safeCampaigns.map(c => c.year)) : (initialYear || new Date().getFullYear());
    const nextYear = maxYear + 1;

    // ... validación de existente (aunque debería ser redundante ahora) ...
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
      // 1. Cerrar la campaña actualmente activa (si existe)
      await closeActiveCampaign({
        project_id: currentProjectId!,
      });

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

      // 3. Recargar datos
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
    if (!currentProjectId) return;

    // Usamos el ID de la campaña que se está editando (guardado en el estado o hook)
    // OJO: En tu código actual usas 'currentCampaign' (año) o 'currentCampaignId'.
    // Asegúrate de tener el ID correcto. Si el wizard setea el año en 'currentCampaign',
    // buscamos el ID así:
    const targetCampaign = campaigns.find(c => Number(c.year) === currentCampaign);
    if (!targetCampaign) return;
    const campaignId = targetCampaign.id;

    try {
      // 1. Calcular totales para actualizar la cabecera de la campaña
      const totalKg = data.produccionPorMonte.reduce((acc: number, p: any) => acc + (p.kgRecolectados || 0), 0);

      // 2. Preparar el array para la API (Mapeo exacto de nombres)
      const productionsData = data.produccionPorMonte
        .filter((p: any) => p.kgRecolectados > 0)
        .map((p: any) => ({
          monte_id: parseInt(p.monteId), // Asegurar número
          quantity_kg: p.kgRecolectados,
          is_estimated: data.metodo === 'total' ? 1 : 0,
        }));

      // 3. ENVIAR A LA BASE DE DATOS (Nueva Tabla)
      await createProductionsByCampaign(campaignId, {
        project_id: currentProjectId,
        productions: productionsData,
        input_type: data.metodo === 'detallado' ? 'detail' : 'total',
      });

      // 4. ACTUALIZAR LA CAMPAÑA (Solo precio y totales, limpiamos los JSON viejos)
      await updateCampaign(campaignId, {
        average_price: data.precioPromedio,
        total_production: totalKg, // Esto actualiza la tarjeta visualmente rápido
        montes_contribuyentes: null, // Limpieza
        montes_production: null,     // Limpieza
      });

      // 5. RECARGAR EL STORE (Crucial para que las gráficas y tablas se actualicen)
      const { loadAllProductions } = useDataStore.getState();
      await loadAllProductions(campaigns);

      toast({
        title: "Éxito",
        description: "Datos de producción guardados correctamente.",
      });

      // Cerrar modales
      setEditingData(null);
      setWizardOpen(false);
      setEditData(null);
      setEditOpen(false);

    } catch (error) {
      console.error('Error saving production:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los datos.",
        variant: "destructive",
      });
    }
  };

  // Función auxiliar para cargar datos antes de editar
  const handleOpenEdit = async (campaign: Campaign) => {
    setCurrentCampaign(campaign.year); // Sincronizamos el año seleccionado
    
    try {
        // 1. Pedir datos a la API
        const productionsData: any[] = await getProductionsByCampaign(campaign.id) as any[];
        
        // 2. Determinar método (mirando el primer registro)
        const firstRecord = productionsData[0];
        const metodo = firstRecord?.input_type === 'detail' ? 'detallado' : 'total';
        const precioPromedio = Number(campaign.average_price || 0);

        const produccionPorMonte = montes
            .filter(m => m.añoPlantacion <= campaign.year)
            .map(monte => {
                // CORRECCIÓN AQUÍ: Usar 'monte' en lugar de 'm'
                const edad = campaign.year - monte.añoPlantacion; 
                
                // Búsqueda segura de IDs (String vs Number)
                const record = productionsData.find(p => String(p.monte_id) === String(monte.id));
                
                return {
                    monteId: monte.id, 
                    nombre: monte.nombre,
                    hectareas: monte.hectareas,
                    edad: edad,
                    kgRecolectados: record ? Number(record.quantity_kg) : 0
                };
            });

        // 4. Abrir el modal con los datos listos
        setEditData({
            precioPromedio,
            metodo,
            produccionPorMonte
        });
        setEditOpen(true);

    } catch (error) {
        console.error("Error cargando datos para edición:", error);
        toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
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

            const totalProductionKg = campaign ? getTotalProductionByCampaign(campaign.id) : 0;  

            const averagePrice = campaign ? Number(campaign.average_price || 0) : 0;
            const totalRevenue = totalProductionKg * averagePrice;


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
                        <p className="text-lg font-semibold text-foreground">
                          {totalProductionKg.toLocaleString()} kg
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-secondary">
                        <TrendingUp className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ingresos</p>
                        <p className="text-lg font-semibold text-accent">
                          {formatCurrency(totalRevenue, true)}
                        </p>
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
                        const hayDatos = campaign ? getTotalProductionByCampaign(campaign.id) > 0 : false;

                        if (hayDatos) {
                          // SI HAY DATOS: Abrimos el formulario de edición
                          handleOpenEdit(campaign!);
                        } else {
                          // SI NO HAY DATOS: Abrimos el formulario de registro
                          setCurrentCampaign(year);
                          setEditingData(null);
                          setWizardOpen(true);
                        }
                      }}
                    >
                      {campaign && getTotalProductionByCampaign(campaign.id) > 0 ? 'Editar Producción' : 'Cargar Producción'}
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
