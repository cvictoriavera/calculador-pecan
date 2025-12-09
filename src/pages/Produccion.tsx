import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Package, DollarSign, Edit, Trash2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { RegistrarProduccionForm } from "@/components/produccion/forms/RegistrarProduccionForm";
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
    

      // Update campaign in database
      if (currentCampaignId) {
       
        const result = await updateCampaign(currentCampaignId, {
          average_price: data.precioPromedio,
          total_production: totalKg,
        });
        console.log('Update campaign result:', result);
      } else {
        console.log('No currentCampaignId, skipping update');
      }

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

      // Prepare montes data
      const montesContribuyentes = (data as any).produccionPorMonte.filter((p: any) => p.kgRecolectados > 0).map((p: any) => p.monteId);
      const montesProduction = (data as any).metodo === 'detallado' ? (data as any).produccionPorMonte.reduce((acc: any, p: any) => {
        if (p.kgRecolectados > 0) acc[p.monteId] = p.kgRecolectados;
        return acc;
      }, {}) : null;

      // Update campaign in database
      if (currentCampaignId) {
        await updateCampaign(currentCampaignId, {
          average_price: data.precioPromedio,
          total_production: totalKg,
          montes_contribuyentes: JSON.stringify(montesContribuyentes),
          montes_production: montesProduction ? JSON.stringify(montesProduction) : null,
        });
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
                const campana = productionCampaigns.find(pc => pc.year === currentCampaign);
                const prodByMonte = productions
                  .filter(p => p.year === currentCampaign)
                  .reduce((acc, p) => {
                    acc[p.monteId] = (acc[p.monteId] || 0) + p.kgHarvested;
                    return acc;
                  }, {} as Record<string, number>);
                // Get montes in the same order as in the form
                const montesDisponibles = montes
                  .filter((m) => m.añoPlantacion <= currentCampaign)
                  .map((m) => ({
                    ...m,
                    edad: currentCampaign - m.añoPlantacion,
                  }));
                const produccionPorMonte = montesDisponibles.map(monte => ({
                  monteId: monte.id,
                  nombre: monte.nombre,
                  hectareas: monte.hectareas,
                  edad: monte.edad,
                  kgRecolectados: prodByMonte[monte.id] || 0,
                }));
                setEditingData({
                  precioPromedio: campana?.averagePrice || 0,
                  metodo: "detallado", // Assume detallado for editing
                  produccionPorMonte,
                });
                setWizardOpen(true);
              }}
              variant="outline"
              className="gap-2"
            >
              <Edit className="h-5 w-5" />
              Editar Producción
            </Button>
            <Button
              onClick={async () => {
                try {
                  // Update campaign in database to remove production data
                  if (currentCampaignId) {
                    await updateCampaign(currentCampaignId, {
                      average_price: 0,
                      total_production: 0,
                    });
                  }

                  // Delete from local Zustand stores
                  productions.filter((p) => p.year === currentCampaign).forEach((p) => deleteProduction(p.id));
                  productionCampaigns.filter((pc) => pc.year === currentCampaign).forEach((pc) => deleteProductionCampaign(pc.id));
                } catch (error) {
                  console.error('Error deleting production:', error);
                  // TODO: Show error message to user
                }
              }}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="h-5 w-5" />
              
            </Button>
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
    </div>
  );
};

export default Produccion;
