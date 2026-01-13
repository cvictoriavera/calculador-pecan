import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, Info, Pencil, MoreVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useApp } from "@/contexts/AppContext";
import type { Monte } from "@/contexts/AppContext";
import { AddMonteDialog } from "@/components/AddMonteDialog";
import { EditMonteDialog } from "@/components/EditMonteDialog";
import { toast } from "sonner";

const Montes = () => {
  const { montes, currentCampaign, deleteMonte } = useApp();
  const [editingMonte, setEditingMonte] = useState<Monte | null>(null);
  const [deletingMonte, setDeletingMonte] = useState<Monte | null>(null);
  
  // Filter montes based on selected campaign and sort by planting year (oldest first)
  const filteredMontes = montes
    .filter((monte) => monte.añoPlantacion <= currentCampaign)
    .sort((a, b) => a.añoPlantacion - b.añoPlantacion);

  const montesWithAge = filteredMontes.map((monte) => ({
    ...monte,
    edad: currentCampaign - monte.añoPlantacion,
  }));

  const handleDeleteMonte = async () => {
    if (!deletingMonte) return;

    try {
      await deleteMonte(deletingMonte.id);
      toast.success("Monte eliminado exitosamente");
      setDeletingMonte(null);
    } catch (error) {
      console.error('Error deleting monte:', error);
      toast.error("Error al eliminar el monte");
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl mb-2">Mis Montes</h1>
          <p className="text-muted-foreground">Gestión de lotes de producción</p>
        </div>
        <AddMonteDialog />
      </div>

      {/* Educational Card */}
      <Card className="bg-amber-50 border-amber-200 mb-6">
        <CardContent className="flex items-start gap-4 p-4">
          <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium font-semibold text-amber-900">
              ¿Qué consideramos un "Monte" o un "Lote"? 
            </p>
            <p className="text-sm text-amber-800/90 leading-relaxed">
              Definimos como un <strong>Monte individual</strong> a un sector de tierra con una densidad especifica y donde los árboles tienen el mismo año de plantación.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {montesWithAge.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Montes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{montesWithAge.length}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Superficie Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {montesWithAge.reduce((acc, m) => acc + m.hectareas, 0).toFixed(1)} ha
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Edad Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {Math.round(montesWithAge.reduce((acc, m) => acc + m.edad, 0) / montesWithAge.length)} años
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Montes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {montesWithAge.map((monte) => (
          <Card
            key={monte.id}
            className="border-border/50 shadow-md hover:shadow-lg transition-all relative"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditingMonte(monte)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeletingMonte(monte)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <CardHeader>
              <div className="flex justify-between items-start pr-8">
                <CardTitle className="text-lg font-bold text-foreground">{monte.nombre}</CardTitle>
                {monte.edad < 7 ? (
                  <Badge variant="secondary" className="bg-warning text-warning-foreground">
                    En Crecimiento
                  </Badge>
                ) : (
                  <Badge className="bg-accent text-accent-foreground">Producción</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-medium">{monte.hectareas} hectáreas</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Plantación: {monte.añoPlantacion} ({monte.edad} años)
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State (hidden when there's data) */}
      {montesWithAge.length === 0 && (
        <Card className="border-border/50 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {montes.length === 0 
                ? "Aún no has registrado montes"
                : `No hay montes en la Campaña ${currentCampaign}`
              }
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              {montes.length === 0
                ? "Comienza agregando tu primer lote de producción para comenzar a gestionar tus campañas"
                : "Los montes se filtran según el año de la campaña seleccionada. Cambia la campaña o agrega nuevos montes."
              }
            </p>
            <AddMonteDialog />
          </CardContent>
        </Card>
      )}

      {/* Edit Monte Dialog */}
      {editingMonte && (
        <EditMonteDialog
          monte={editingMonte}
          open={!!editingMonte}
          onOpenChange={(open) => !open && setEditingMonte(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMonte} onOpenChange={(open) => !open && setDeletingMonte(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar monte?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el monte "{deletingMonte?.nombre}" y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMonte} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Montes;
