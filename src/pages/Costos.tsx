import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, TrendingUp, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import AddCostoSheet from "@/components/costos/AddCostoSheet";
import { useDataStore } from "@/stores";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCalculationsStore } from "@/stores/calculationsStore";



const categoriaLabels: Record<string, string> = {
  insumos: "Insumos",
  combustible: "Combustible",
  "mano-obra": "Mano de Obra",
  energia: "Energía",
  cosecha: "Cosecha",
  "gastos-admin": "Administración",
  mantenimientos: "Mantenimientos",
  "costos-oportunidad": "Oportunidad",
};

const categoriaColors: Record<string, string> = {
  insumos: "#16af92",
  combustible: "#22469c",
  "mano-obra": "#ba995c",
  energia: "#f2c02b",
  cosecha: "#f2794a",
  "gastos-admin": "#762c4d",
  mantenimientos: "#cb2030",
  "costos-oportunidad": "#bc5930",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const filteredPayload = payload.filter((item: any) => item.value > 0);
    if (filteredPayload.length === 0) return null;

    return (
      <div style={{
        backgroundColor: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "8px",
        padding: "10px"
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{`Año: ${label}`}</p>
        {filteredPayload.map((item: any, index: number) => (
          <p key={index} style={{ color: item.color, margin: '5px 0' }}>
            {`${item.name}: $${item.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Costos = () => {
  const { currentProjectId, campaigns, currentCampaign, costsLoading } = useApp();
  const { costs, addCost, updateCost, deleteCost } = useDataStore();
  const { getCostByCategory, getTotalCostsByCampaign } = useCalculationsStore();

  

  // Selección segura de la campaña
  const currentCampaignObj = useMemo(() => {
    return campaigns.find((c) => Number(c.year) === Number(currentCampaign));
  }, [campaigns, currentCampaign]);

  // Total usando el store de cálculos
  const totalCostos = currentCampaignObj ? getTotalCostsByCampaign(currentCampaignObj.id) : 0;

  // Filtrado de lista (Tabla inferior)
  const costosFiltered = useMemo(() => {
    if (!currentCampaignObj) return [];
    return costs.filter((c: any) => String(c.campaign_id) === String(currentCampaignObj.id));
  }, [costs, currentCampaignObj]);

  const currentYear = new Date().getFullYear();

  // Datos para el gráfico
  const chartData = useMemo(() => {
    if (campaigns.length === 0) return [];

    return campaigns
      .sort((a, b) => Number(a.year) - Number(b.year))
      .map((campaign) => {
        const year = Number(campaign.year);
        
        const costsByCategory = getCostByCategory(campaign.id);

        const yearData: any = { year };
        
        Object.keys(categoriaLabels).forEach((category) => {
          yearData[category] = costsByCategory[category] || 0;
        });

        return yearData;
      });
  }, [campaigns, getCostByCategory, costs]);

  // Helper para la tabla de evolución
  const getCostForCategoryAndYear = (category: string, year: number): number => {
    const campaign = campaigns.find((c) => Number(c.year) === year);
    if (!campaign) return 0;
    const costsByCategory = getCostByCategory(campaign.id);
    return costsByCategory[category] || 0;
  };

  const getCostoDescription = (costo: any) => {
    if (costo.details && typeof costo.details === 'object') {
      if (costo.details.type) return costo.details.type;
      if (costo.details.subtype) {
        const subtypeLabels: Record<string, string> = {
          'machinery': 'Tractores',
          'vehicles': 'Vehículos/Rodados',
          'irrigation': 'Riego',
          'other': 'Otros'
        };
        return subtypeLabels[costo.details.subtype] || costo.details.subtype;
      }
    }
    return categoriaLabels[costo.category] || costo.category;
  };

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCosto, setEditingCosto] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [costoToDelete, setCostoToDelete] = useState<any>(null);

  const handleDeleteCosto = (costo: any) => {
    setCostoToDelete(costo);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (costoToDelete) {
      try {
        await deleteCost(costoToDelete.id);
        toast.success("Costo eliminado correctamente");
      } catch (error) {
        toast.error("Error al eliminar el costo");
        console.error("Error deleting cost:", error);
      }
    }
    setDeleteDialogOpen(false);
    setCostoToDelete(null);
  };

  const handleEditCosto = (costo: any) => {
    setEditingCosto(costo);
    setSheetOpen(true);
  };

  const handleUpdateCosto = async (categoriaOrData: string | any, formData?: any) => {
    console.log('handleUpdateCosto called with:', categoriaOrData, formData);
    if (!currentProjectId) {
      toast.error("No hay proyecto activo");
      return;
    }

    if (!currentCampaignObj) {
      toast.error("No se pudo encontrar la campaña actual");
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
          toast.success("Costo actualizado");
        } else {
          await addCost({
            project_id: currentProjectId,
            campaign_id: currentCampaignObj.id,
            category: costData.category,
            details: costData.details,
            total_amount: costData.total_amount,
          });
          toast.success("Costo registrado");
        }
      }
      else if (typeof formData === 'object' && formData.category) {
         if (formData.existingId) {
          await updateCost(formData.existingId, {
            category: formData.category,
            details: formData.details,
            total_amount: formData.total_amount,
          });
          toast.success("Costo actualizado");
        } else {
          await addCost({
            project_id: currentProjectId,
            campaign_id: currentCampaignObj.id,
            category: formData.category,
            details: formData.details,
            total_amount: formData.total_amount,
          });
          toast.success("Costo registrado");
        }
      }
      else if (editingCosto) {
        const categoria = categoriaOrData as string;
        await updateCost(editingCosto.id, {
          category: categoria,
          details: formData,
          total_amount: formData?.total || formData?.total_amount || 0,
        });
        toast.success("Costo actualizado");
        setEditingCosto(null);
      }
      else {
        const categoria = categoriaOrData as string;
        await addCost({
          project_id: currentProjectId,
          campaign_id: currentCampaignObj.id,
          category: categoria,
          details: formData,
          total_amount: formData?.total || formData?.total_amount || 0,
        });
        toast.success("Costo registrado");
      }
    } catch (error) {
      toast.error("Error al guardar el costo");
      console.error("Error saving cost:", error);
    }
  };

  const displayedYears = useMemo(() => {
    if (campaigns.length === 0) return [];
    return campaigns.map(c => Number(c.year)).sort((a, b) => a - b);
  }, [campaigns]);

  if (costsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Cargando costos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl mb-2">Costos Operativos</h1>
          <p className="text-muted-foreground">
            Registro de gastos operacionales - Campaña {currentCampaign}
          </p>
        </div>
        <Button
          onClick={() => setSheetOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Plus className="h-5 w-5" />
          Nuevo Costo
        </Button>
      </div>

      <Card className="border-border/50 shadow-md bg-gradient-to-br from-card to-secondary/30">
        <CardHeader>
          <CardTitle className="text-foreground">Resumen de Costos {currentCampaign}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-warning/10">
              <TrendingUp className="h-8 w-8 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Costos Operativos</p>
              <p className="text-4xl font-bold text-foreground">${totalCostos.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-foreground">Evolución de Costos por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip content={CustomTooltip} />
                <Legend />
                {Object.keys(categoriaLabels).map((category) => (
                  <Bar
                    key={category}
                    dataKey={category}
                    stackId="a"
                    fill={categoriaColors[category] || "#cccccc"}
                    name={categoriaLabels[category]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Sin datos para mostrar
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-foreground">Tabla de Evolución de Costos</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="sticky left-0 z-20 bg-card text-left p-2 sm:p-3 text-sm font-semibold text-muted-foreground border-r border-border">
                    Categoría
                  </th>
                  {displayedYears.map((year, index) => {
                    const isHistorical = year < currentYear;
                    const isCurrentYear = year === currentYear;
                    const nextYear = displayedYears[index + 1];

                    return (
                      <th
                        key={year}
                        className={cn(
                          "text-center p-2 sm:p-3 text-sm font-semibold relative",
                          isHistorical && "bg-slate-50/50",
                          isCurrentYear && "border-r-2 border-yellow-500"
                        )}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>{year}</span>
                        </div>
                        {isCurrentYear && nextYear && (
                          <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-yellow-500"></div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Object.entries(categoriaLabels).map(([categoryKey, categoryName]) => (
                  <tr key={categoryKey} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="sticky left-0 z-10 bg-card p-2 sm:p-3 border-r border-border">
                      <Badge
                        style={{
                          backgroundColor: categoriaColors[categoryKey] || "#cccccc",
                          color: "white",
                        }}
                      >
                        {categoryName}
                      </Badge>
                    </td>
                    {displayedYears.map((year) => {
                      const amount = getCostForCategoryAndYear(categoryKey, year);
                      const isHistorical = year < currentYear;

                      return (
                        <td
                          key={year}
                          className={cn(
                            "text-center p-2 sm:p-3 text-sm font-semibold text-foreground",
                            isHistorical && "bg-slate-50/20"
                          )}
                        >
                          ${amount.toLocaleString()}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-primary/5">
                  <td className="sticky left-0 z-20 bg-primary/5 p-3 border-r border-border">
                    <div className="font-semibold text-foreground">Total U$D</div>
                  </td>
                  {displayedYears.map((year) => {
                    const total = Object.keys(categoriaLabels).reduce((sum, category) =>
                      sum + getCostForCategoryAndYear(category, year), 0);
                    const isHistorical = year < currentYear;

                    return (
                      <td
                        key={year}
                        className={cn(
                          "text-center p-3 font-bold text-foreground",
                          isHistorical && "bg-slate-50/20"
                        )}
                      >
                        ${total.toLocaleString()}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-foreground">Registro de Costos</CardTitle>
        </CardHeader>
        <CardContent>
          {costosFiltered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Año</th>
                    <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Categoría</th>
                    <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Descripción</th>
                    <th className="text-right p-3 text-sm font-semibold text-muted-foreground">Monto</th>
                    <th className="text-center p-3 text-sm font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {costosFiltered.map((costo: any) => (
                    <tr key={costo.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="p-3 text-sm font-medium text-foreground">{currentCampaign}</td>
                      <td className="p-3 text-sm">
                        <Badge
                          style={{
                            backgroundColor: categoriaColors[costo.category] || "#cccccc",
                            color: "white",
                          }}
                        >
                          {categoriaLabels[costo.category] || costo.category}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-foreground">{getCostoDescription(costo)}</td>
                      <td className="p-3 text-sm text-right font-semibold text-foreground">
                        ${Number(costo.total_amount).toLocaleString()}
                      </td>
                      <td className="p-3 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleEditCosto(costo)}
                            title="Editar costo"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteCosto(costo)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay costos registrados para la campaña {currentCampaign}.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AddCostoSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingCosto(null);
        }}
        onSave={handleUpdateCosto}
        editingCosto={editingCosto}
        existingCosts={costosFiltered}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este costo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente el registro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ESTE EXPORT ES CRÍTICO PARA EL ERROR DE APP.TSX
export default Costos;