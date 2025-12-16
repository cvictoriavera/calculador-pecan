import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, TrendingUp, Package, DollarSign, Edit, Trash2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { RegistrarProduccionForm } from "@/components/produccion/forms/RegistrarProduccionForm";
import { EditarProduccionForm } from "@/components/produccion/forms/EditarProduccionForm";
import { EvolucionProductiva } from "@/components/produccion/EvolucionProductiva";
import { formatCurrency } from "@/lib/calculations";
import { useDataStore } from "@/stores/dataStore";
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

const Produccion = () => {
  const { currentCampaign, campaigns, currentCampaignId, updateCampaign, montes } = useApp();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  // Get data from stores
  const productions = useDataStore((state) => state.productions);
  const productionCampaigns = useDataStore((state) => state.productionCampaigns);

  // Store actions
  const addProduction = useDataStore((state) => state.addProduction);
  const addProductionCampaign = useDataStore((state) => state.addProductionCampaign);
  const updateProductionCampaign = useDataStore((state) => state.updateProductionCampaign);
  const deleteProduction = useDataStore((state) => state.deleteProduction);
  const deleteProductionCampaign = useDataStore((state) => state.deleteProductionCampaign);

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


  // Prepare chart data
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

  // Current campaign stats
  const currentCampanaData = productionCampaigns.find(pc => Number(pc.year) === currentCampaign);
  const totalProduccion = currentCampanaData?.totalProduction || 0;
  const totalFacturacion = (currentCampanaData?.totalProduction || 0) * (currentCampanaData?.averagePrice || 0);
  const precioPromedio = currentCampanaData?.averagePrice || 0;


  // Load production data from campaigns when campaigns change
  useEffect(() => {
    campaigns.forEach(camp => {
      const existing = productionCampaigns.find(pc => pc.year === camp.year);
      if (camp.average_price !== undefined && camp.total_production !== undefined) {
        const newAveragePrice = parseFloat(camp.average_price);
        const newTotalProduction = parseFloat(camp.total_production);
        const newDate = new Date(camp.updated_at || camp.created_at);
        if (existing) {
          // Only update if values changed
          if (existing.averagePrice !== newAveragePrice || existing.totalProduction !== newTotalProduction) {
            updateProductionCampaign(existing.id, {
              averagePrice: newAveragePrice,
              totalProduction: newTotalProduction,
              date: newDate,
            });
          }
        } else {
          addProductionCampaign({
            id: `campaign-${camp.year}`,
            year: camp.year,
            averagePrice: newAveragePrice,
            totalProduction: newTotalProduction,
            date: newDate,
          });
        }
      }
    });
  }, [campaigns, productionCampaigns, addProductionCampaign, updateProductionCampaign]);

  // Check if has production for current campaign (from database)
  const currentCamp = campaigns.find(c => Number(c.year) === currentCampaign);
  const hasProduction = currentCamp && currentCamp.average_price !== undefined && currentCamp.total_production !== undefined &&
                        (parseFloat(currentCamp.average_price) > 0 || parseFloat(currentCamp.total_production) > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Producción</h1>
          <p className="text-muted-foreground">
            Registro y análisis de cosecha - Campaña {currentCampaign}
          </p>
        </div>
        {hasProduction ? (
          <div className="flex gap-2">
            <Button
             onClick={() => {
                // 1. Obtenemos la campaña y normalizamos datos
                const campana = campaigns.find(c => Number(c.year) === currentCampaign);
                const totalProduccionRegistrada = campana?.total_production ? Number(campana.total_production) : 0;
                
                let prodByMonte: Record<string, number> = {};
                let metodoDetectado: "detallado" | "total" = "detallado";

                // 2. ESTRATEGIA DE RECUPERACIÓN DE DATOS
                
                // ESCENARIO 1: Existe el JSON detallado (Opción B usada originalmente)
                if (campana && (campana as any).montes_production) {
                  try {
                    const rawData = (campana as any).montes_production;
                    prodByMonte = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
                    metodoDetectado = "detallado";
                  } catch (e) {
                    console.error("Error parseando JSON de producción:", e);
                  }
                } 
                // ESCENARIO 2: No hay JSON, pero hay Total y Contribuyentes (Opción A usada originalmente)
                else if (campana && (campana as any).montes_contribuyentes && totalProduccionRegistrada > 0) {
                  metodoDetectado = "total"; // Marcamos que fue método total para que el UI lo sepa
                  try {
                    // a. Obtenemos los IDs de los montes que participaron
                    const rawContrib = (campana as any).montes_contribuyentes;
                    // Normalizamos IDs a string para evitar errores de comparación
                    const idsContribuyentes: string[] = (typeof rawContrib === 'string' ? JSON.parse(rawContrib) : rawContrib).map(String);
                    
                    // b. Buscamos los objetos monte completos para saber sus hectáreas
                    const montesQueAportaron = montes.filter(m => idsContribuyentes.includes(String(m.id)));
                    
                    // c. Calculamos el total de hectáreas de esos montes específicos
                    const totalHectareas = montesQueAportaron.reduce((sum, m) => sum + m.hectareas, 0);
                    
                    // d. Distribuimos proporcionalmente (Regla de tres simple por superficie)
                    if (totalHectareas > 0) {
                      const rendimientoPromedio = totalProduccionRegistrada / totalHectareas;
                      
                      montesQueAportaron.forEach(m => {
                        // Producción estimada = Hectáreas * Rendimiento Promedio
                        prodByMonte[String(m.id)] = Math.round(m.hectareas * rendimientoPromedio);
                      });
                    }
                  } catch (e) {
                    console.error("Error recalculando distribución proporcional:", e);
                  }
                }

                // 3. Preparación final de datos para el Formulario (Hidratación)
                const montesDisponibles = montes
                  .filter((m) => m.añoPlantacion <= currentCampaign)
                  .map((m) => ({
                    ...m,
                    edad: Number(currentCampaign) - Number(m.añoPlantacion),
                  }));

                const produccionPorMonte = montesDisponibles.map(monte => ({
                  monteId: monte.id,
                  nombre: monte.nombre,
                  hectareas: monte.hectareas,
                  edad: monte.edad,
                  // Aquí es donde la magia ocurre: ya sea que vino del JSON o del recálculo, el dato existe
                  kgRecolectados: prodByMonte[String(monte.id)] || 0,
                }));

                setEditData({
                  precioPromedio: campana?.average_price ? Number(campana.average_price) : 0,
                  metodo: metodoDetectado, // Le pasamos al form el método original
                  produccionPorMonte,
                });
                
                setEditOpen(true);
              }}
              variant="outline"
              className="gap-2"
            >
              <Edit className="h-5 w-5" />
              Editar Producción
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-5 w-5" />
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
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      try {
                        console.log('Starting production deletion for campaign:', currentCampaignId);
                        // Update campaign in database to remove production data
                        if (currentCampaignId) {
                          const updateData = {
                            average_price: 0,
                            total_production: 0,
                            montes_contribuyentes: null,
                            montes_production: null,
                          };
                          console.log('Updating campaign with data:', updateData);
                          const result = await updateCampaign(currentCampaignId, updateData);
                          console.log('Campaign update result:', result);
                        }

                        // Delete from local Zustand stores
                        productions.filter((p) => p.year === currentCampaign).forEach((p) => deleteProduction(p.id));
                        productionCampaigns.filter((pc) => pc.year === currentCampaign).forEach((pc) => deleteProductionCampaign(pc.id));
                        console.log('Production deletion completed successfully');
                      } catch (error) {
                        console.error('Error deleting production:', error);
                        // TODO: Show error message to user
                      }
                    }}
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <Button
            onClick={() => setWizardOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Plus className="h-5 w-5" />
            Registrar Cosecha
          </Button>
        )}
      </div>

      {/* KPI Cards - Only show when has production */}
      {hasProduction && (
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
              Precio Promedio
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
              Facturación Estimada
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
      )}
{/* Empty State */}
      {!hasProduction && (
        <Card className="border-border/50 shadow-md border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Sin registro de producción
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Aún no has registrado la cosecha para la campaña {currentCampaign}. Usa el asistente
              de cierre para cargar los datos de producción.
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
      
      {/* Combo Chart - Production & Revenue Evolution */}
      {campaigns.length > 0 && (
      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-foreground">Evolución de Producción y Facturación</CardTitle>
        </CardHeader>
        <CardContent>
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
                    return [`${value.toLocaleString()} Kg`, "Producción"];
                  }
                  return [formatCurrency(value, true), "Facturación"];
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
        </CardContent>
        </Card>
      )}

      {/* Production Evolution Matrix */}
      {montes.length > 0 && campaigns.length > 0 && (
        <EvolucionProductiva campaigns={campaigns} montes={montes} />
      )}

      

      {/* Wizard Modal */}
      <RegistrarProduccionForm
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSave={handleSaveProduccion}
        editingData={editingData}
      />

      {/* Edit Modal */}
      <EditarProduccionForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleSaveProduccion}
        editingData={editData}
      />
    </div>
  );
};

export default Produccion;
