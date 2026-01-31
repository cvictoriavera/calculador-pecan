import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, TrendingUp, Loader2, Pencil, X, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import type { ProductionRecord } from '@/stores/dataStore';
import { Skeleton } from "@/components/ui/skeleton";

const categoriaLabels: Record<string, string> = {
  tierra: "Tierra",
  mejoras: "Mejoras",
  implantacion: "Implantación",
  riego: "Riego",
  maquinaria: "Maquinaria",
};

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

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

  const isTrialMode = () => localStorage.getItem('isTrialMode') === 'true';
  const maxCampaigns = 5;
  const currentYear = new Date().getFullYear();
  const manualCampaigns = campaigns.filter(c => c.year > currentYear).length;
  const isCampaignDisabled = isTrialMode() && manualCampaigns >= maxCampaigns;

  const { getTotalCostsByCampaign, getTotalInvestmentsByCampaign, getTotalProductionByCampaign } = useCalculationsStore();
  
  // Stores
  const loadAllProductions = useDataStore((state) => state.loadAllProductions);
  const productionCampaigns = useDataStore((state) => state.productionCampaigns); // Necesario para verificar si ya hay datos
  const costs = useDataStore((state) => state.costs);
  const addCost = useDataStore((state) => state.addCost);
  const updateCost = useDataStore((state) => state.updateCost);
  const investments = useDataStore((state) => state.investments);
  const addInvestment = useDataStore((state) => state.addInvestment);
  const updateInvestment = useDataStore((state) => state.updateInvestment);
  const loadProductions = useDataStore((state) => state.loadProductions);

  // States
  const [isCreating, setIsCreating] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [costoSheetOpen, setCostoSheetOpen] = useState(false);
  const [editingCosto, setEditingCosto] = useState<any>(null);
  const [inversionSheetOpen, setInversionSheetOpen] = useState(false);
  const [editingInversion, setEditingInversion] = useState<any>(null);
  
  // UI States for specific interactions
  const [editingMonth, setEditingMonth] = useState<{ [year: number]: boolean }>({});
  const [updatingMonth, setUpdatingMonth] = useState<{ [year: number]: boolean }>({});
  const [loadingAction, setLoadingAction] = useState<{ [year: number]: string | null }>({}); // Controla spinner en botones
  
  // Estado de carga inteligente (Stale-while-revalidate)
  const [isLoadingData, setIsLoadingData] = useState(productionCampaigns.length === 0);

  // Efecto de carga optimizado
  useEffect(() => {
    const fetchData = async () => {
      if (campaigns && campaigns.length > 0) {
        
        // Solo mostramos el indicador de carga si NO tenemos datos previos.
        // Si ya hay datos, el usuario los ve mientras actualizamos en "silencio".
        if (productionCampaigns.length === 0) {
           setIsLoadingData(true);
        }

        try {
          await loadAllProductions(campaigns);
        } catch (error) {
          console.error("Error loading productions:", error);
        } finally {
          setIsLoadingData(false);
        }
      } else {
         setIsLoadingData(false);
      }
    };
    fetchData();
  }, [campaigns, loadAllProductions]);

  const handleNuevaCampana = async () => {
   if (isTrialMode() && manualCampaigns >= maxCampaigns) {
     toast({
       title: "Límite alcanzado",
       description: `Como usuario suscriptor, puedes crear un máximo de ${maxCampaigns} campañas adicionales a partir del año actual.`,
       variant: "destructive",
     });
     return;
   }

   setIsCreating(true);
    const maxYear = safeCampaigns.length > 0 ? Math.max(...safeCampaigns.map(c => c.year)) : (initialYear || new Date().getFullYear());
    const nextYear = maxYear + 1;
    const existing = safeCampaigns.find(c => c.year === nextYear);
    if (existing) {
      toast({
        title: "Error",
        description: `Ya existe una campaña para el año ${nextYear}`,
        variant: "destructive",
      });
      setIsCreating(false);
      return;
    }

    try {
      if (!isTrialMode()) {
        await closeActiveCampaign({
          project_id: currentProjectId!,
        });
      }

      await createCampaign({
        project_id: currentProjectId!,
        campaign_name: `Campaña ${nextYear}`,
        year: nextYear,
        start_date: `Julio ${nextYear}`,
        end_date: `Junio ${nextYear + 1}`,
        status: 'open',
        is_current: 1,
      });
      toast({
        title: "Éxito",
        description: `Campaña ${nextYear} creada exitosamente`,
      });
      await loadCampaigns();
      setCurrentCampaign(nextYear);
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la campaña",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const safeCampaigns = campaigns || [];

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

  const formatCampaignDates = (campaign: Campaign | null, year: number) => {
    if (!campaign) {
        return `Enero ${year} - Enero ${year + 1}`;
    }

    if (campaign.start_date && !campaign.start_date.includes('-')) {
        const endText = campaign.end_date || `${campaign.start_date.split(' ')[0]} ${year + 1}`;
        return `${campaign.start_date} - ${endText}`;
    }

    const start = new Date(campaign.start_date);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    return `${months[start.getUTCMonth()]} ${start.getFullYear()} - ${months[end.getUTCMonth()]} ${end.getFullYear()}`;
  };

  const handleMonthChange = async (year: number, monthIndex: number) => {
    const campaign = getCampaignForYear(year);
    if (!campaign) return;
    
    setUpdatingMonth(prev => ({ ...prev, [year]: true }));
    try {
      const startMonthName = months[monthIndex];
      const endMonthIndex = (monthIndex - 1 + 12) % 12; 
      const endMonthName = months[endMonthIndex];

      const newStartDate = `${startMonthName} ${year}`;
      const newEndDate = `${endMonthName} ${year + 1}`;
      
      await updateCampaign(campaign.id, {
        start_date: newStartDate,
        end_date: newEndDate,
      });
      await loadCampaigns();
      setEditingMonth(prev => ({ ...prev, [year]: false }));
    } catch (error) {
      console.error('Error updating campaign month:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el mes de la campaña",
        variant: "destructive",
      });
    } finally {
      setUpdatingMonth(prev => ({ ...prev, [year]: false }));
    }
  };

  const handleSaveProduccion = async (data: any) => {
    try {
      const isEdit = editingData !== null || editData !== null;
      const totalKg = data.produccionPorMonte.reduce((acc: number, p: any) => acc + p.kgRecolectados, 0);
      const productionsData = data.produccionPorMonte
        .filter((p: any) => p.kgRecolectados > 0)
        .map((p: any) => ({
          monte_id: parseInt(p.monteId),
          quantity_kg: p.kgRecolectados,
          is_estimated: data.metodo === 'total' ? 1 : 0,
        }));

      if (currentCampaignId && currentProjectId) {
        await createProductionsByCampaign(currentCampaignId, {
          project_id: currentProjectId,
          productions: productionsData,
          input_type: data.metodo === 'detallado' ? 'detail' : 'total',
        });
        await updateCampaign(currentCampaignId, {
          average_price: data.precioPromedio,
          total_production: totalKg,
          montes_contribuyentes: null,
          montes_production: null,
        });
      }
      
      if (currentCampaignId) {
        const { loadProductions } = useDataStore.getState();
        await loadProductions(currentCampaignId);
      }

      setEditingData(null);
      setWizardOpen(false);
      setEditData(null);
      setEditOpen(false);
      toast({
        title: "Datos Guardados ...",
        description: isEdit ? "Los datos se actualizaron correctamente" : "Los datos se guardaron correctamente",
      });
    } catch (error) {
      console.error('Error saving production:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    }
  };

  const handleOpenEdit = async (campaign: Campaign) => {
    // 1. Activar loading para este botón específico
    setLoadingAction(prev => ({ ...prev, [campaign.year]: 'produccion' }));

    try {
      if (campaign.id) {
        // Cargar en store primero
        await loadProductions(campaign.id);
        
        // Obtener datos para el formulario
        const productionsData = await getProductionsByCampaign(campaign.id) as ProductionRecord[];
        const precioPromedio = campaign.average_price ? parseFloat(campaign.average_price) : 0;
  
        const firstRecord = productionsData[0] as ProductionRecord;
        const metodo = firstRecord?.input_type === 'detail' ? 'detallado' : 'total';

        const montesDisponibles = montes
          .filter((m) => m.añoPlantacion <= campaign.year)
          .map((m) => ({
            ...m,
            edad: Number(campaign.year) - Number(m.añoPlantacion),
          }));

        const produccionPorMonte = montesDisponibles.map(monte => {
          const productionRecord = productionsData.find((p: ProductionRecord) => String(p.monte_id) === monte.id.split('.')[0]);
  
          return {
              monteId: monte.id,
              nombre: monte.nombre,
              hectareas: monte.hectareas,
              edad: monte.edad,
              kgRecolectados: productionRecord ? Number(productionRecord.quantity_kg) : 0,
          };
        });

        const editDataToSet = {
          precioPromedio,
          metodo,
          produccionPorMonte,
        };
        setEditData(editDataToSet);
        setEditOpen(true);
      }
    } catch (error) {
      console.error('Error loading production data for edit:', error);
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
    } finally {
        // 2. Desactivar loading
        setLoadingAction(prev => ({ ...prev, [campaign.year]: null }));
    }
  };

  const handleUpdateCosto = async (categoriaOrData: string | any, formData?: any) => {
    if (!currentProjectId) {
      toast({ title: "Error", description: "No hay proyecto activo", variant: "destructive" });
      return;
    }
    if (!currentCampaignId) {
      toast({ title: "Error", description: "No se pudo encontrar la campaña actual", variant: "destructive" });
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
          toast({ title: "Éxito", description: "Costo actualizado" });
        } else {
          await addCost({
            project_id: currentProjectId,
            campaign_id: currentCampaignId,
            category: costData.category,
            details: costData.details,
            total_amount: costData.total_amount,
          });
          toast({ title: "Éxito", description: "Costo registrado" });
        }
      }
      else if (typeof formData === 'object' && formData.category) {
         if (formData.existingId) {
          await updateCost(formData.existingId, {
            category: formData.category,
            details: formData.details,
            total_amount: formData.total_amount,
          });
          toast({ title: "Éxito", description: "Costo actualizado" });
        } else {
          await addCost({
            project_id: currentProjectId,
            campaign_id: currentCampaignId,
            category: formData.category,
            details: formData.details,
            total_amount: formData.total_amount,
          });
          toast({ title: "Éxito", description: "Costo registrado" });
        }
      }
      else if (editingCosto) {
        const categoria = categoriaOrData as string;
        await updateCost(editingCosto.id, {
          category: categoria,
          details: formData,
          total_amount: formData?.total || formData?.total_amount || 0,
        });
        toast({ title: "Éxito", description: "Costo actualizado" });
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
        toast({ title: "Éxito", description: "Costo registrado" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error al guardar el costo", variant: "destructive" });
      console.error("Error saving cost:", error);
    }
  };

  const handleSaveInversion = async (categoria: string, data: any) => {
    if (!currentProjectId) {
      toast({ title: "Error", description: "No hay proyecto activo", variant: "destructive" });
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
        toast({ title: "Éxito", description: "Inversión actualizada correctamente" });
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
        toast({ title: "Éxito", description: "Inversión registrada correctamente" });
      }
    } catch (error) {
      console.error("Error saving investment:", error);
      toast({ title: "Error", description: "Error al guardar la inversión", variant: "destructive" });
    }
  };

  if (!initialYear) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl text-foreground mb-2">Campañas</h1>
            <p className="text-muted-foreground">Gestión de ciclos anuales de Producción</p>
          </div>
        </div>
        <Card className="border-border/50 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl text-foreground mb-2">Configuración incompleta</h3>
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
          <h1 className="text-3xl mb-2">Campañas</h1>
          <p className="text-muted-foreground">Gestión de ciclos anuales de producción</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleNuevaCampana}
            disabled={isCreating || isCampaignDisabled}
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
          {isTrialMode() && (
            <span className="text-sm text-muted-foreground">
              ({manualCampaigns}/{maxCampaigns})
            </span>
          )}
        </div>
      </div>

      {/* Educational Card */}
      <Card className="bg-amber-50 border-amber-200 mb-6">
        <CardContent className="flex items-start gap-4 p-4">
          <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium font-semibold text-amber-900">
              ¿Cómo funcionan los ciclos de Campaña?
            </p>
            <p className="text-sm text-amber-800/90 leading-relaxed">
              Cada campaña representa un <strong>ciclo productivo completo de 12 meses</strong> (ej: de Julio a Junio del año siguiente).
              Para que el sistema calcule correctamente la rentabilidad, asegúrate de que todos los registros de 
              <strong> producción, costos e inversiones</strong> correspondan estrictamente al período de fechas indicado en la tarjeta de la campaña.
            </p>
          </div>
        </CardContent>
      </Card>

      {!currentProjectId ? (
        <Card className="border-border/50 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl text-foreground mb-2">Proyecto no configurado</h3>
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
                      <CardTitle className="text-2xl text-foreground">
                        Campaña {year}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {editingMonth[year] ? (
                          <div className="flex items-center gap-2">
                             {updatingMonth[year] ? (
                                <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm text-muted-foreground">Actualizando...</span>
                                </div>
                            ) : (
                                <Select
                                    value={campaign?.start_date ? campaign.start_date.split(' ')[0] : months[0]}
                                    onValueChange={(value: string) => {
                                        const monthIndex = months.indexOf(value);
                                        handleMonthChange(year, monthIndex);
                                    }}
                                    disabled={updatingMonth[year]}
                                >
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map((month, index) => (
                                        <SelectItem key={index} value={month}>{month}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            
                            {!updatingMonth[year] && (
                                <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingMonth(prev => ({ ...prev, [year]: false }))}
                                className="p-1 h-6 w-6"
                                >
                                <X className="h-4 w-4" />
                                </Button>
                            )}
                            {!updatingMonth[year] && (
                                <p className="text-sm text-muted-foreground mb-0">Define el mes de inicio</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground mb-0">
                            {formatCampaignDates(campaign, year)}
                          </p>
                        )}
                        {!editingMonth[year] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingMonth(prev => ({ ...prev, [year]: !prev[year] }))}
                            className="p-1 h-6 w-6"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {campaign ? (
                      campaign.status === 'open' ? (
                        <Badge className="bg-pecan text-accent-foreground b">
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
                      <div className="p-3 rounded-lg bg-cream">
                        <Calendar className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-0">Duración</p>
                        <p className="text-lg font-semibold text-foreground mb-0">12 meses</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-cream">
                        <TrendingUp className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-0">Producción</p>
                        <div className="min-h-[28px] flex items-center">
                          {isLoadingData ? (
                            <Skeleton className="h-6 w-24 bg-border/50" />
                          ) : (
                            <p className="text-lg font-semibold text-foreground mb-0">
                                {totalProductionKg.toLocaleString()} kg
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-cream">
                        <TrendingUp className="h-6 w-6 text-accent mb-0" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-0">Ingresos</p>
                        <div className="min-h-[28px] flex items-center">
                            {isLoadingData ? (
                                <Skeleton className="h-6 w-24 bg-border/50" />
                            ) : (
                                <p className="text-lg font-semibold text-accent mb-0">
                                    {formatCurrency(totalRevenue, true)}
                                </p>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-cream">
                        <TrendingUp className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-0">Costos</p>
                        <div className="min-h-[28px] flex items-center">
                            {isLoadingData ? (
                                <Skeleton className="h-6 w-24 bg-border/50" />
                            ) : (
                                <p className="text-lg font-semibold text-accent mb-0"> 
                                    {campaign ? formatCurrency(getTotalCostsByCampaign(campaign.id), true) : '$0'}
                                </p>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-cream">
                         <TrendingUp className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-0">Invertido</p>
                        <div className="min-h-[28px] flex items-center">
                            {isLoadingData ? (
                                <Skeleton className="h-6 w-24 bg-border/50" />
                            ) : (
                                <p className="text-lg font-semibold text-accent mb-0">
                                {(() => {
                                    const total = campaign ? getTotalInvestmentsByCampaign(campaign.id) : 0;
                                    return formatCurrency(total, true);
                                })()}
                                </p>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      disabled={loadingAction[year] === 'produccion'}
                      onClick={() => {
                        if (isTrialMode()) {
                          setCurrentCampaign(year);
                          navigate('/produccion');
                        } else {
                          const hayDatos = campaign ? getTotalProductionByCampaign(campaign.id) > 0 : false;
                          if (hayDatos) {
                            handleOpenEdit(campaign!);
                          } else {
                            setCurrentCampaign(year);
                            setEditingData(null);
                            setWizardOpen(true);
                          }
                        }
                      }}
                    >
                      {loadingAction[year] === 'produccion' ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Cargando...
                          </>
                      ) : (
                        campaign && getTotalProductionByCampaign(campaign.id) > 0 ? 'Editar Producción' : 'Cargar Producción'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setCurrentCampaign(year);
                        if (isTrialMode()) {
                          navigate('/costos');
                        } else {
                          setCostoSheetOpen(true);
                        }
                      }}
                    >
                      {campaign && getTotalCostsByCampaign(campaign.id) > 0 ? 'Editar Costos' : 'Registrar Costos'}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setCurrentCampaign(year);
                        if (isTrialMode()) {
                          navigate('/inversiones');
                        } else {
                          if (campaign && investments.filter(inv => inv.campaign_id === campaign.id).length > 0) {
                            navigate('/inversiones');
                          } else {
                            setInversionSheetOpen(true);
                          }
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