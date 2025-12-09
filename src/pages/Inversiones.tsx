import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { getInvestmentsByCampaign, createInvestment, updateInvestment as updateInvestmentApi, deleteInvestment as deleteInvestmentApi } from "@/services/investmentService";
import { toast } from "sonner";

interface InversionRegistro {
  id: string;
  year: number;
  category: string;
  description: string;
  amount: number;
  date: Date;
  data?: any;
}

const categoriaLabels: Record<string, string> = {
  tierra: "Tierra",
  mejoras: "Mejoras",
  implantacion: "Implantación",
  riego: "Riego",
  maquinaria: "Maquinaria",
};

const categoriaColors: Record<string, string> = {
  tierra: "bg-green-600",
  mejoras: "bg-blue-600",
  implantacion: "bg-purple-600",
  riego: "bg-cyan-600",
  maquinaria: "bg-orange-600",
};

const Inversiones = () => {
  const { currentProjectId, campaigns, currentCampaign } = useApp();
  const { investments, addInvestment, updateInvestment, deleteInvestment } = useDataStore();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingInversion, setEditingInversion] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inversionToDelete, setInversionToDelete] = useState<any>(null);

  // Filter investments by current campaign year
  const inversionesFiltered = investments.filter((inv) => inv.year === currentCampaign);
  const totalInversionesCampaña = inversionesFiltered.reduce((acc, inv) => acc + inv.amount, 0);

  // Load investments from database when project or campaign changes
  useEffect(() => {
    const loadInvestments = async () => {
      if (currentProjectId) {
        // Find the current campaign
        const currentCamp = campaigns.find(c => Number(c.year) === currentCampaign);
        if (currentCamp) {
          try {
            const dbInvestments = await getInvestmentsByCampaign(currentProjectId, currentCamp.id);

            // Create investments with correct year
            const newInvestments = dbInvestments.map(inv => ({
              id: inv.id.toString(),
              year: currentCampaign, // Use the current campaign year
              category: inv.category,
              description: inv.description,
              amount: Number(inv.total_value) || 0,
              date: new Date(inv.created_at),
              data: inv.details,
            }));

          // Update the store directly using Zustand's setState
          useDataStore.setState({ investments: newInvestments });
        } catch (error) {
          console.error("Error loading investments:", error);
          // Clear investments on error
          useDataStore.setState({ investments: [] });
        }
        } else {
          // Clear investments if no campaign found
          useDataStore.setState({ investments: [] });
        }
      } else {
        // Clear investments if no project
        useDataStore.setState({ investments: [] });
      }
    };

    loadInvestments();
  }, [currentProjectId, campaigns, currentCampaign]);


  const handleSaveInversion = async (categoria: string, data: any) => {
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

    const categoriaLabel = categoriaLabels[categoria];
    const descripcion = data.descripcion || data.items?.map((i: any) => i.tipo).join(", ") || categoriaLabel;
    const monto = data.total || data.precio || 0;

    try {
      if (editingInversion) {
        // Update existing investment
        await updateInvestmentApi(parseInt(editingInversion.id), {
          category: categoria,
          description: descripcion,
          total_value: monto,
          details: data,
        });
        // Update local state
        updateInvestment(editingInversion.id, {
          category: categoria,
          description: descripcion,
          amount: monto,
          data,
        });
        toast.success("Inversión actualizada correctamente");
        setEditingInversion(null);
      } else {
        // Create new investment
        const result = await createInvestment({
          project_id: currentProjectId,
          campaign_id: currentCamp.id,
          category: categoria,
          description: descripcion,
          total_value: monto,
          details: data,
        });
        // Add to local state
        addInvestment({
          id: result.id.toString(),
          year: currentCampaign,
          category: categoria,
          description: descripcion,
          amount: monto,
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

  const handleEditInversion = (inversion: InversionRegistro) => {
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Inversiones</h1>
          <p className="text-muted-foreground">Registro de inversiones de capital - Campaña {currentCampaign}</p>
        </div>
        <Button onClick={handleOpenSheet} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="h-5 w-5" />
          Nueva Inversión
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="border-border/50 shadow-md bg-gradient-to-br from-card to-secondary/30">
        <CardHeader>
          <CardTitle className="text-foreground">Resumen de Inversiones {currentCampaign}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Invertido</p>
              <p className="text-4xl font-bold text-foreground">{formatCurrency(totalInversionesCampaña, true)}</p>
            </div>
          </div>
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
                  {inversionesFiltered.map((inversion) => (
                    <tr key={inversion.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="p-3 text-sm font-medium text-foreground">{currentCampaign}</td>
                      <td className="p-3 text-sm">
                        <Badge
                          className={`${
                            categoriaColors[inversion.category] || "bg-muted"
                          } text-white hover:opacity-90`}
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
                  ))}
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
