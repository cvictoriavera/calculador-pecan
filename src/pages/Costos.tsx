import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import AddCostoSheet from "@/components/costos/AddCostoSheet";
import { useDataStore } from "@/stores";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";

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
  insumos: "#CF7E3C",
  combustible: "#5C4844",
  "mano-obra": "#846761",
  energia: "#F9A300",
  cosecha: "#CF7E3C",
  "gastos-admin": "#2F2928",
  mantenimientos: "#5C4844",
  "costos-oportunidad": "#846761",
};


const Costos = () => {
  const { currentProjectId, campaigns, currentCampaign } = useApp();
  const { costs, loadCosts, addCost, updateCost, deleteCost } = useDataStore();

  console.log('Costos page - currentCampaign:', currentCampaign);

  // Función para obtener la descripción específica del costo
  const getCostoDescription = (costo: any) => {
    // Si tiene detalles y es de tipo insumos o combustible, mostrar el tipo específico
    if (costo.details && typeof costo.details === 'object') {
      if (costo.details.type) {
        return costo.details.type;
      }
      // Para compatibilidad con datos antiguos que usan subtype
      if (costo.details.subtype) {
        // Para combustible - mapear subtipos a nombres legibles
        const subtypeLabels: Record<string, string> = {
          'machinery': 'Tractores',
          'vehicles': 'Vehículos/Rodados',
          'irrigation': 'Riego',
          'other': 'Otros'
        };
        return subtypeLabels[costo.details.subtype] || costo.details.subtype;
      }
    }

    // Para otros tipos de costos, mostrar la categoría genérica
    return categoriaLabels[costo.category] || costo.category;
  };

  // Load costs when component mounts or campaign changes
  useEffect(() => {
    const loadCostsData = async () => {
      if (currentProjectId) {
        // Find the current campaign
        const currentCamp = campaigns.find(c => Number(c.year) === currentCampaign);
        if (currentCamp) {
          try {
            await loadCosts(currentProjectId, currentCamp.id);
          } catch (error) {
            console.error("Error loading costs:", error);
          }
        }
      }
    };

    loadCostsData();
  }, [currentProjectId, campaigns, currentCampaign, loadCosts]);

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

  // const handleEditCosto = (costo: any) => {
  //   setEditingCosto(costo);
  //   setSheetOpen(true);
  // };

  const handleUpdateCosto = async (categoriaOrData: string | any, formData?: any) => {
    if (!currentProjectId) {
      toast.error("No hay proyecto activo");
      return;
    }

    // Find the current campaign
    const currentCamp = campaigns.find(c => Number(c.year) === currentCampaign);
    if (!currentCamp) {
      toast.error("No se pudo encontrar la campaña actual");
      return;
    }

    try {
      // Check if this is the new format (object with category, details, total_amount) - direct from forms like InsumosForm
      if (typeof categoriaOrData === 'object' && categoriaOrData.category) {
        const costData = categoriaOrData;
        await addCost({
          project_id: currentProjectId,
          campaign_id: currentCamp.id,
          category: costData.category,
          details: costData.details,
          total_amount: costData.total_amount,
        });
        toast.success("Costo registrado correctamente");
      }
      // Check if formData is the new format (when called from AddCostoSheet with category string + new format data)
      else if (typeof formData === 'object' && formData.category) {
        await addCost({
          project_id: currentProjectId,
          campaign_id: currentCamp.id,
          category: formData.category,
          details: formData.details,
          total_amount: formData.total_amount,
        });
        toast.success("Costo registrado correctamente");
      }
      // Legacy format for editing or other forms
      else if (editingCosto) {
        const categoria = categoriaOrData as string;
        await updateCost(editingCosto.id, {
          category: categoria,
          details: formData,
          total_amount: formData?.total || formData?.total_amount || 0,
        });
        toast.success("Costo actualizado correctamente");
        setEditingCosto(null);
      }
      // Legacy format for single cost creation
      else {
        const categoria = categoriaOrData as string;
        await addCost({
          project_id: currentProjectId,
          campaign_id: currentCamp.id,
          category: categoria,
          details: formData,
          total_amount: formData?.total || formData?.total_amount || 0,
        });
        toast.success("Costo registrado correctamente");
      }
    } catch (error) {
      toast.error("Error al guardar el costo");
      console.error("Error saving cost:", error);
    }
  };


  // All costs are already filtered by current campaign
  const costosFiltered = costs;
  const totalCostos = costosFiltered.reduce((acc, c) => acc + parseFloat(String(c.total_amount || 0)), 0);

  // Prepare data for pie chart
  const costoPorCategoria = costosFiltered.reduce((acc, cost) => {
    const costValue = parseFloat(String(cost.total_amount || 0));
    const existing = acc.find((item) => item.name === cost.category);
    if (existing) {
      existing.value += costValue;
    } else {
      acc.push({ name: cost.category, value: costValue });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Costos Operativos</h1>
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

      {/* Summary and Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <CardTitle className="text-foreground">Distribución por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {costoPorCategoria.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={costoPorCategoria}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry) => `${categoriaLabels[entry.name] || entry.name}: $${entry.value.toLocaleString()}`}
                  >
                    {costoPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={categoriaColors[entry.name] || "#cccccc"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sin datos para mostrar
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Costs Table */}
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
                  {costosFiltered.map((costo) => (
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
                        ${costo.total_amount.toLocaleString()}
                      </td>
                      <td className="p-3 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground opacity-50 cursor-not-allowed"
                            disabled={true}
                            title="Editar próximamente"
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
              <p>No hay costos registrados para esta campaña.</p>
              <p className="text-sm mt-1">Haz clic en "Nuevo Costo" para comenzar.</p>
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
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este costo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el registro de {categoriaLabels[costoToDelete?.category] || costoToDelete?.category}.
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

export default Costos;
