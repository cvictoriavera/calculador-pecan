import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, TrendingDown, Pencil, Trash2 } from "lucide-react";
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
import { useApp } from "@/contexts/AppContext";

interface InversionRegistro {
  id: number;
  año: number;
  categoria: string;
  descripcion: string;
  monto: number;
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
  Tierra: "bg-cocoa",
  Mejoras: "bg-camel",
  Implantación: "bg-primary",
  Riego: "bg-accent",
  Maquinaria: "bg-warning",
};

const Inversiones = () => {
  const { currentCampaign } = useApp();
  const [inversiones, setInversiones] = useState<InversionRegistro[]>([
    { id: 1, año: 2025, categoria: "Maquinaria", descripcion: "Shaker nuevo", monto: 8000 },
    { id: 2, año: 2024, categoria: "Riego", descripcion: "Sistema de riego por goteo", monto: 10000 },
    { id: 3, año: 2023, categoria: "Maquinaria", descripcion: "Tractor John Deere", monto: 15000 },
    { id: 4, año: 2022, categoria: "Implantación", descripcion: "Nuevos árboles Lote Oeste", monto: 20000 },
    { id: 5, año: 2021, categoria: "Maquinaria", descripcion: "Acoplado para cosecha", monto: 30000 },
  ]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingInversion, setEditingInversion] = useState<InversionRegistro | null>(null);
  const [inversionToDelete, setInversionToDelete] = useState<InversionRegistro | null>(null);

  // Filter investments by current campaign
  const inversionesFiltered = inversiones.filter((inv) => inv.año === currentCampaign);
  const totalInversionesCampaña = inversionesFiltered.reduce((acc, inv) => acc + inv.monto, 0);


  const handleSaveInversion = (categoria: string, data: any) => {
    const categoriaLabel = categoriaLabels[categoria];
    const descripcion = data.descripcion || data.items?.map((i: any) => i.tipo).join(", ") || categoriaLabel;
    const monto = data.total || data.precio || 0;

    if (editingInversion) {
      setInversiones(
        inversiones.map((inv) =>
          inv.id === editingInversion.id
            ? { ...inv, categoria: categoriaLabel, descripcion, monto, data }
            : inv
        )
      );
      setEditingInversion(null);
    } else {
      const newInversion: InversionRegistro = {
        id: Date.now(),
        año: currentCampaign,
        categoria: categoriaLabel,
        descripcion,
        monto,
        data,
      };
      setInversiones([newInversion, ...inversiones]);
    }
  };

  const handleEditInversion = (inversion: InversionRegistro) => {
    setEditingInversion(inversion);
    setSheetOpen(true);
  };

  const handleDeleteInversion = (inversion: InversionRegistro) => {
    setInversionToDelete(inversion);
  };

  const confirmDelete = () => {
    if (inversionToDelete) {
      setInversiones(inversiones.filter((inv) => inv.id !== inversionToDelete.id));
      setInversionToDelete(null);
    }
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
      {inversiones.length > 0 ? (
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
                      <td className="p-3 text-sm font-medium text-foreground">{inversion.año}</td>
                      <td className="p-3 text-sm">
                        <Badge
                          className={`${
                            categoriaColors[inversion.categoria] || "bg-muted"
                          } text-white hover:opacity-90`}
                        >
                          {inversion.categoria}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-foreground">{inversion.descripcion}</td>
                      <td className="p-3 text-sm text-right font-semibold text-foreground">
                        {formatCurrency(inversion.monto, true)}
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
        <Card className="border-border/50 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingDown className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No hay inversiones registradas</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              No hay inversiones registradas para la campaña {currentCampaign}. Comienza registrando tus inversiones de capital.
            </p>
            <Button onClick={handleOpenSheet} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="h-5 w-5" />
              Registrar Primera Inversión
            </Button>
          </CardContent>
        </Card>
      )}

      <AddInversionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handleSaveInversion}
        editingInversion={editingInversion}
      />

      <AlertDialog open={!!inversionToDelete} onOpenChange={() => setInversionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar inversión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la inversión "{inversionToDelete?.descripcion}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Inversiones;
