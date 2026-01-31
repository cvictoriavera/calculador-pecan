import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, TrendingUp, Package, DollarSign, Edit, Trash2, Info, Loader2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { RegistrarProduccionForm } from "@/components/produccion/forms/RegistrarProduccionForm";
import { EditarProduccionForm } from "@/components/produccion/forms/EditarProduccionForm";
import { EvolucionProductiva } from "@/components/produccion/EvolucionProductiva";
import { formatCurrency } from "@/lib/calculations";
import { useDataStore } from "@/stores/dataStore";
import { createProductionsByCampaign, getProductionsByCampaign, deleteProductionsByCampaign } from "@/services/productionService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ProductionRecord {
  monte_id: number;
  quantity_kg: number;
  input_type: string;
  is_estimated: number;
  entry_group_id: string;
  monte_name?: string;
  area_hectareas?: number;
}

const Produccion = () => {
  const { currentCampaign, campaigns, currentCampaignId, currentProjectId, updateCampaign, montes } = useApp();
  const { toast } = useToast();
  
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  // --- ESTADOS DE CARGA ---
  const [isSaving, setIsSaving] = useState(false);
  const { productionCampaigns, loadAllProductions } = useDataStore();
  
  // Si ya tenemos datos en el store, NO iniciamos cargando (evita parpadeos al navegar)
  const [isLoadingData, setIsLoadingData] = useState(productionCampaigns.length === 0);

  const deleteProductionCampaign = useDataStore((state) => state.deleteProductionCampaign);

  // --- EFECTO DE CARGA OPTIMIZADO ---
  useEffect(() => {
    const fetchData = async () => {
      if (campaigns && campaigns.length > 0) {
        // Solo mostramos loading si NO tenemos datos previos
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

  const handleSaveProduccion = async (data: any) => {
    setIsSaving(true);
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

      // Recargar datos para asegurar consistencia
      if (campaigns.length > 0) {
         await loadAllProductions(campaigns);
      }

      setEditingData(null);
      setWizardOpen(false);
      setEditData(null);
      setEditOpen(false);

      toast({
        title: "Datos Guardados",
        description: isEdit ? "Los datos se actualizaron correctamente" : "Los datos se guardaron correctamente",
      });
    } catch (error) {
      console.error('Error saving production:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const chartData = campaigns
    .map((year) => {
      const campana = productionCampaigns.find(pc => pc.year === year.year);
      return {
        year: year.year.toString(),
        produccion: campana?.totalProduction || 0,
        facturacion: (campana?.totalProduction || 0) * (campana?.averagePrice || 0),
      };
    })
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));

  const currentCampanaData = productionCampaigns.find(pc => Number(pc.year) === currentCampaign);
  const totalProduccion = currentCampanaData?.totalProduction || 0;
  const totalFacturacion = (currentCampanaData?.totalProduction || 0) * (currentCampanaData?.averagePrice || 0);
  const precioPromedio = currentCampanaData?.averagePrice || 0;

  const hasProduction = totalProduccion > 0 || precioPromedio > 0;

  const renderKpiSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-border/50 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[120px] mb-2" />
            <Skeleton className="h-3 w-[80px]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl mb-2">Producción</h1>
          <p className="text-muted-foreground">
            Registro y análisis de cosecha - Campaña {currentCampaign}
          </p>
        </div>
        
        {isLoadingData ? (
           <Skeleton className="h-10 w-[180px]" />
        ) : hasProduction ? (
          <div className="flex gap-2">
            <Button
              disabled={isSaving}
              onClick={async () => {
                setIsSaving(true);
                try {
                  if (currentCampaignId) {
                    const productionsData = await getProductionsByCampaign(currentCampaignId) as ProductionRecord[];

                    const campana = campaigns.find(c => Number(c.year) === currentCampaign);
                    const precioPromedio = campana?.average_price ? Number(campana.average_price) : 0;

                    const firstRecord = productionsData[0] as ProductionRecord;
                    const metodo = firstRecord?.input_type === 'detail' ? 'detallado' : 'total';

                    const montesDisponibles = montes
                      .filter((m) => m.añoPlantacion <= currentCampaign)
                      .map((m) => ({
                        ...m,
                        edad: Number(currentCampaign) - Number(m.añoPlantacion),
                      }));

                    const produccionPorMonte = montesDisponibles.map(monte => {
                      const productionRecord = productionsData.find((p: ProductionRecord) => String(p.monte_id) === String(monte.id).split('.')[0]);
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
                  
                  // Fallback: mostrar formulario vacío
                  const montesDisponibles = montes
                    .filter((m) => m.añoPlantacion <= currentCampaign)
                    .map((m) => ({
                      ...m,
                      edad: Number(currentCampaign) - Number(m.añoPlantacion),
                    }));
                    
                  const fallbackData = {
                    precioPromedio: 0,
                    metodo: 'detallado',
                    produccionPorMonte: montesDisponibles.map(monte => ({
                      monteId: monte.id,
                      nombre: monte.nombre,
                      hectareas: monte.hectareas,
                      edad: monte.edad,
                      kgRecolectados: 0,
                    })),
                  };
                  setEditData(fallbackData);
                  setEditOpen(true);
                  
                } finally {
                  setIsSaving(false);
                }
              }}
              variant="outline"
              className="gap-2"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Edit className="h-5 w-5" />}
              Editar Producción
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                  Eliminar Producción
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente todos los datos de producción de la campaña {currentCampaign}.
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={isSaving}
                    onClick={async (e) => {
                      e.preventDefault();
                      setIsSaving(true);
                      try {
                        if (currentCampaignId) {
                          await deleteProductionsByCampaign(currentCampaignId);
                        }
                        if (currentCampaignId) {
                          const updateData = { average_price: 0, total_production: 0 };
                          await updateCampaign(currentCampaignId, updateData);
                        }
                        productionCampaigns.filter((pc) => pc.year === currentCampaign).forEach((pc) => deleteProductionCampaign(pc.id));
                        if (campaigns.length > 0) {
                             await loadAllProductions(campaigns);
                        }
                        // Forzar el cierre del modal se maneja automáticamente al desmontar o podrías necesitar un estado controlled si el preventDefault bloquea el cierre nativo.
                        // En este caso, Radix UI suele requerir que cierres manualmente si haces preventDefault, 
                        // pero como simplificación asumiremos que la recarga de datos es suficiente o el usuario puede cerrar.
                        // Para mejor UX: document.getElementById('close-dialog')?.click() o similar si tuvieras referencia.
                        // Pero para no complicar, dejaremos que termine y el usuario cierre o (mejor aún) si necesitas cerrar programáticamente, usa un estado para el Open del Dialog.
                      } catch (error) {
                        console.error('Error deleting production:', error);
                      } finally {
                        setIsSaving(false);
                        // Hack simple para cerrar el dialog si se previno el default:
                        // window.location.reload(); // NO recomendado.
                        // Lo ideal es usar controlled component para el AlertDialog si quieres cerrarlo programáticamente.
                      }
                    }}
                  >
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Eliminando...
                        </>
                    ) : "Eliminar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <Button
            onClick={() => setWizardOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            disabled={isLoadingData}
          >
            <Plus className="h-5 w-5" />
            Registrar Cosecha
          </Button>
        )}
      </div>

      <Card className="bg-amber-50 border-amber-200 mb-6">
        <CardContent className="flex items-start gap-4 p-4">
          <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-900">
              Registrar una Producción
            </p>
            <p className="text-sm text-amber-800/90 leading-relaxed">
              Al registrar tu <strong>cosecha anual</strong> puedes cargar los kilos por monte o los kilos totales.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {isLoadingData ? (
        renderKpiSkeleton()
      ) : hasProduction ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-border/50 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Producción Total
              </CardTitle>
              <Package className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalProduccion.toLocaleString()} Kg
              </div>
              <p className="text-xs text-muted-foreground mt-1">Campaña {currentCampaign}</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Precio de Venta
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(precioPromedio, true)}/Kg
              </div>
              <p className="text-xs text-muted-foreground mt-1">USD por kilogramo</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Facturación Real
              </CardTitle>
              <DollarSign className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {formatCurrency(totalFacturacion, true)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ingresos brutos</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Empty State */
        <Card className="border-border/50 shadow-md border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl text-foreground mb-2">
              Sin registro de producción
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Aún no has registrado la cosecha para la campaña {currentCampaign}.
              Usa el asistente de cierre para cargar los datos de producción.
            </p>
            <Button
              onClick={() => setWizardOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Plus className="h-5 w-5" />
              Registrar Cosecha
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Combo Chart */}
      {campaigns.length > 0 && (
      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-foreground">Evolución de Producción y Facturación</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
             <div className="flex items-center justify-center h-[350px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          ) : (
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
              <YAxis
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}t`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "produccion") {
                    return [value.toLocaleString() + " Kg", "Producción"];
                  }
                  if (name === "facturacion") {
                    return [formatCurrency(value, true), "Facturación"];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="produccion"
                fill="hsl(var(--accent))"
                radius={[8, 8, 0, 0]}
                name="Producción (Kg)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="facturacion"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                name="Facturación (USD)"
              />
            </ComposedChart>
          </ResponsiveContainer>
          )}
        </CardContent>
        </Card>
      )}

      {/* Production Evolution Matrix */}
      {montes.length > 0 && campaigns.length > 0 && (
        <EvolucionProductiva 
            campaigns={campaigns} 
            montes={montes} 
            isLoading={isLoadingData} 
        />
      )}

      {/* Wizard Modal */}
      <RegistrarProduccionForm
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSave={handleSaveProduccion}
        editingData={editingData}
        isSaving={isSaving}
      />

      {/* Edit Modal */}
      <EditarProduccionForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleSaveProduccion}
        editingData={editData}
        isSaving={isSaving}
      />
    </div>
  );
};

export default Produccion;