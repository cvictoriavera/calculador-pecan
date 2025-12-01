import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, Info, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import type { Monte } from "@/contexts/AppContext";
import { AddMonteDialog } from "@/components/AddMonteDialog";
import { EditMonteDialog } from "@/components/EditMonteDialog";

const Montes = () => {
  const { montes, currentCampaign } = useApp();
  const [editingMonte, setEditingMonte] = useState<Monte | null>(null);
  
  // Filter montes based on selected campaign
  const filteredMontes = montes.filter(
    (monte) => monte.añoPlantacion <= currentCampaign
  );

  const montesWithAge = filteredMontes.map((monte) => ({
    ...monte,
    edad: currentCampaign - monte.añoPlantacion,
  }));
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Mis Montes</h1>
          <p className="text-muted-foreground">Gestión de lotes de producción</p>
        </div>
        <AddMonteDialog />
      </div>

      {/* Educational Card */}
      <Card className="border-border/50 shadow-md bg-secondary/10">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-foreground mb-1">¿Qué consideramos un "Monte"?</p>
            <p className="text-sm text-muted-foreground">
              Definimos como un Monte individual a un sector de tierra donde los árboles tienen el mismo año de plantación y una densidad similar.
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
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setEditingMonte(monte)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
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
              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground">Variedad</p>
                <p className="text-base font-semibold text-foreground">{monte.variedad}</p>
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
    </div>
  );
};

export default Montes;
