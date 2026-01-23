import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, DollarSign, Pencil, Trash2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
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
import AddInversionSheet from "@/components/inversiones/AddInversionSheet";
import { formatCurrency } from "@/lib/calculations";
import { useDataStore } from "@/stores";
import { useApp } from "@/contexts/AppContext";
import { createInvestment, updateInvestment as updateInvestmentApi, deleteInvestment as deleteInvestmentApi } from "@/services/investmentService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


const categoriaLabels: Record<string, string> = {
  tierra: "Tierra",
  mejoras: "Mejoras",
  implantacion: "Implantación",
  riego: "Riego",
  maquinaria: "Maquinaria",
};

const categoriaColors: Record<string, string> = {
  tierra: "#60225f", 
  mejoras: "#d3203e", 
  implantacion: "#16af92", 
  riego: "#70cddc", 
  maquinaria: "#193f70", 
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

const Inversiones = () => {
  const { currentProjectId, campaigns, currentCampaign } = useApp();
  const { investments, addInvestment, updateInvestment, deleteInvestment } = useDataStore();

  // Calculate displayed years - only campaign years
  const displayedYears = useMemo(() => {
    if (campaigns.length === 0) return [];
    const years = campaigns.map(c => c.year).sort((a, b) => a - b);
    return years;
  }, [campaigns]);

  // Get current year for visual differentiation
  const currentYear = new Date().getFullYear();

  // Get investment for a specific category and year
  const getInvestmentForCategoryAndYear = (category: string, year: number): number => {
    // Find all campaigns for this year
    const yearCampaigns = campaigns.filter(c => c.year === year);
    if (yearCampaigns.length === 0) return 0;

    return investments
      .filter(inv =>
        yearCampaigns.some(c => String(c.id) === String(inv.campaign_id)) &&
        inv.category === category
      )
      .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  };

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingInversion, setEditingInversion] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inversionToDelete, setInversionToDelete] = useState<any>(null);

  // Filtrado de lista (Tabla inferior) - Mostrar todas las inversiones
  const inversionesFiltered = useMemo(() => {
    return investments; // Mostrar todas las inversiones del proyecto
  }, [investments]);

  const totalInversiones = inversionesFiltered.reduce((acc, inv) => acc + inv.amount, 0);


  // Prepare data for stacked bar chart - investments by year and category
  const chartData = useMemo(() => {
    // Get unique years from campaigns
    const uniqueYears = [...new Set(campaigns.map(c => c.year))].sort((a, b) => a - b);

    return uniqueYears.map((year) => {
      // Find all campaigns for this year
      const yearCampaigns = campaigns.filter(c => c.year === year);

      // Filter investments by all campaigns for this year
      const yearInvestments = investments.filter((inv) =>
        yearCampaigns.some(c => String(c.id) === String(inv.campaign_id))
      );

      const yearData: any = { year };
      Object.keys(categoriaLabels).forEach((category) => {
        const categoryInvestments = yearInvestments.filter((inv) => inv.category === category);

        // Aseguramos que amount sea número al sumar
        const total = categoryInvestments.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
        yearData[category] = total;
      });

      return yearData;
    });
  }, [campaigns, investments]);
  


  const handleSaveInversion = async (categoria: string, data: any) => {
    if (!currentProjectId) {
      toast.error("No hay proyecto activo");
      return;
    }

    const categoriaLabel = categoriaLabels[categoria];
    const descripcion = data.descripcion || data.items?.map((i: any) => i.tipo).join(", ") || categoriaLabel;
    
    // --- Convertir monto a Number explícitamente ---
    // Esto evita que se guarde como string ("1000") y rompa las sumas
    const monto = Number(data.total || data.precio || 0);

    // Find the current campaign
    // Aseguramos comparar números con números
    const currentCamp = campaigns.find(c => Number(c.year) === Number(currentCampaign));

    if (!currentCamp) {
      toast.error("No se pudo encontrar la campaña actual");
      return;
    }

    try {
      if (editingInversion) {
        // Update existing investment (API)
        await updateInvestmentApi(parseInt(editingInversion.id), {
          category: categoria,
          description: descripcion,
          total_value: monto,
          details: data,
        });
        
        // Update local state (Store)
        updateInvestment(editingInversion.id, {
          category: categoria,
          description: descripcion,
          amount: monto, // Enviamos el número limpio
          data,
        });
        
        toast.success("Inversión actualizada correctamente");
        setEditingInversion(null);
      } else {
        // Create new investment (API)
        const result = await createInvestment({
          project_id: currentProjectId,
          campaign_id: currentCamp.id,
          category: categoria,
          description: descripcion,
          total_value: monto,
          details: data,
        });

        // Add to local state (Store)
        addInvestment({
          id: result.id.toString(),
          campaign_id: currentCamp.id,
          category: categoria,
          description: descripcion,
          amount: monto, // Enviamos el número limpio
          date: new Date(),
          data,
        });
        
        toast.success("Inversión registrada correctamente");
      }
    } catch (error) {
      console.error("Error saving investment:", error);
      toast.error("Error al guardar la inversión");
    }
  };

  const handleEditInversion = (inversion: any) => {
    setEditingInversion(inversion);
    setSheetOpen(true);
  };

  const handleDeleteInversion = (inversion: any) => {
    setInversionToDelete(inversion);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (inversionToDelete) {
      try {
        await deleteInvestmentApi(parseInt(inversionToDelete.id));
        // Remove from local state
        deleteInvestment(inversionToDelete.id);
        toast.success("Inversión eliminada correctamente");
      } catch (error) {
        console.error("Error deleting investment:", error);
        toast.error("Error al eliminar la inversión");
      }
    }
    setDeleteDialogOpen(false);
    setInversionToDelete(null);
  };

  const handleOpenSheet = () => {
    setEditingInversion(null);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl mb-2">Inversiones</h1>
          <p className="text-muted-foreground">Registro de inversiones de capital - Campaña {currentCampaign}</p>
        </div>
        <Button onClick={handleOpenSheet} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="h-5 w-5" />
          Nueva Inversión
        </Button>
      </div>

      <Card className="bg-amber-50 border-amber-200 mb-6">
        <CardContent className="flex items-start gap-4 p-4">
          <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium font-semibold text-amber-900">
              Al registrar tus inversiones recuerda: 
            </p>
            <p className="text-sm text-amber-800/90 leading-relaxed">
              Los datos que ingreses deben ser <strong>montos anuales</strong> que tuviste en los meses que duro la campaña en cada uno de los rubros. 
              <br/>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="border-border/50 shadow-md bg-white from-card to-secondary/30">
        <CardHeader>
          <CardTitle className="text-foreground">Resumen de Inversiones {currentCampaign}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Invertido</p>
              <p className="text-4xl font-bold text-foreground">{formatCurrency(totalInversiones, true)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evolution Chart */}
      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-foreground">Evolución de Inversiones por Categoría</CardTitle>
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

      {/* Year Range Selector and Investment Evolution Table */}
      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-foreground">Tabla de Evolución de Inversiones</CardTitle>
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
                        {/* Visual divider between current year and next year */}
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
                      const amount = getInvestmentForCategoryAndYear(categoryKey, year);
                      const isHistorical = year < currentYear;

                      return (
                        <td
                          key={year}
                          className={cn(
                            "text-center p-2 sm:p-3 text-sm ",
                            amount === 0 ? "text-gray-300" : "font-semibold text-foreground",  // Gris super claro para 0, normal para valores
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
                    <div className="font-semibold text-foreground">Total</div>
                  </td>
                  {displayedYears.map((year) => {
                    const total = Object.keys(categoriaLabels).reduce((sum, category) =>
                      sum + getInvestmentForCategoryAndYear(category, year), 0);
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

          {campaigns.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay campañas disponibles para mostrar la evolución de inversiones.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investments Table */}
      {inversionesFiltered.length > 0 ? (
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground">Registro de Inversiones</CardTitle>
          </CardHeader>
          <CardContent>
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
                  {inversionesFiltered.map((inversion) => {
                    // Find the campaign for this investment to get the year
                    const investmentCampaign = campaigns.find(c => c.id === inversion.campaign_id);
                    const investmentYear = investmentCampaign ? investmentCampaign.year : currentCampaign;

                    return (
                      <tr key={inversion.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                        <td className="p-3 text-sm font-medium text-foreground">{investmentYear}</td>
                      <td className="p-3 text-sm">
                        <Badge
                          style={{
                            backgroundColor: categoriaColors[inversion.category] || "#cccccc",
                            color: "white",
                          }}
                        >
                          {categoriaLabels[inversion.category] || inversion.category}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-foreground">{inversion.description}</td>
                      <td className="p-3 text-sm text-right font-semibold text-foreground">
                        {formatCurrency(inversion.amount, true)}
                      </td>
                      <td className="p-3 text-sm text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditInversion(inversion)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteInversion(inversion)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay inversiones registradas para esta campaña.</p>
          <p className="text-sm mt-1">Haz clic en "Nueva Inversión" para comenzar.</p>
        </div>
      )}

      <AddInversionSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingInversion(null);
        }}
        onSave={handleSaveInversion}
        editingInversion={editingInversion}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta inversión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el registro de {categoriaLabels[inversionToDelete?.category] || inversionToDelete?.category}.
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

export default Inversiones;
