import { useState } from "react";
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
  Insumos: "#CF7E3C",
  Combustible: "#5C4844",
  "Mano de Obra": "#846761",
  Energía: "#F9A300",
  Cosecha: "#CF7E3C",
  Administración: "#2F2928",
  Mantenimientos: "#5C4844",
  Oportunidad: "#846761",
};

interface CostoRegistro {
  id: string;
  categoria: string;
  descripcion: string;
  monto: number;
  año: number;
  data?: any;
}

const Costos = () => {
  const { currentCampaign } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [costos, setCostos] = useState<CostoRegistro[]>([]);
  const [editingCosto, setEditingCosto] = useState<CostoRegistro | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [costoToDelete, setCostoToDelete] = useState<CostoRegistro | null>(null);

  const handleDeleteCosto = (costo: CostoRegistro) => {
    setCostoToDelete(costo);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (costoToDelete) {
      setCostos(costos.filter((c) => c.id !== costoToDelete.id));
      toast.success("Costo eliminado correctamente");
    }
    setDeleteDialogOpen(false);
    setCostoToDelete(null);
  };

  const handleEditCosto = (costo: CostoRegistro) => {
    setEditingCosto(costo);
    setSheetOpen(true);
  };

  const handleUpdateCosto = (categoria: string, formData: any) => {
    if (editingCosto) {
      setCostos(costos.map((c) => 
        c.id === editingCosto.id 
          ? { ...c, categoria: categoriaLabels[categoria] || categoria, monto: formData.total || 0, data: formData }
          : c
      ));
      toast.success("Costo actualizado correctamente");
      setEditingCosto(null);
    } else {
      const nuevoCosto: CostoRegistro = {
        id: Date.now().toString(),
        categoria: categoriaLabels[categoria] || categoria,
        descripcion: categoriaLabels[categoria] || categoria,
        monto: formData.total || 0,
        año: currentCampaign,
        data: formData,
      };
      setCostos([...costos, nuevoCosto]);
      toast.success("Costo registrado correctamente");
    }
  };


  const costosFiltered = costos.filter((c) => c.año === currentCampaign);
  const totalCostos = costosFiltered.reduce((acc, cost) => acc + cost.monto, 0);

  // Prepare data for pie chart
  const costoPorCategoria = costosFiltered.reduce((acc, cost) => {
    const existing = acc.find((item) => item.name === cost.categoria);
    if (existing) {
      existing.value += cost.monto;
    } else {
      acc.push({ name: cost.categoria, value: cost.monto });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Costos Operativos</h1>
          <p className="text-muted-foreground">Registro de gastos operacionales - Campaña {currentCampaign}</p>
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
                    label={(entry) => `${entry.name}: $${entry.value.toLocaleString()}`}
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
                      <td className="p-3 text-sm font-medium text-foreground">{costo.año}</td>
                      <td className="p-3 text-sm">
                        <Badge
                          style={{
                            backgroundColor: categoriaColors[costo.categoria] || "#cccccc",
                            color: "white",
                          }}
                        >
                          {costo.categoria}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-foreground">{costo.descripcion}</td>
                      <td className="p-3 text-sm text-right font-semibold text-foreground">
                        ${costo.monto.toLocaleString()}
                      </td>
                      <td className="p-3 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEditCosto(costo)}
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
              Esta acción no se puede deshacer. Se eliminará permanentemente el registro de {costoToDelete?.categoria}.
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
