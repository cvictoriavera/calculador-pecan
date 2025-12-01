import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const campanasData = [
  {
    id: 1,
    año: 2025,
    estado: "Activa",
    fechaInicio: "2025-01-01",
    fechaFin: "2025-12-31",
    produccion: 3200,
    ingresos: 224000,
  },
  {
    id: 2,
    año: 2024,
    estado: "Finalizada",
    fechaInicio: "2024-01-01",
    fechaFin: "2024-12-31",
    produccion: 2800,
    ingresos: 196000,
  },
  {
    id: 3,
    año: 2023,
    estado: "Finalizada",
    fechaInicio: "2023-01-01",
    fechaFin: "2023-12-31",
    produccion: 2500,
    ingresos: 175000,
  },
];

const Campanas = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Campañas</h1>
          <p className="text-muted-foreground">Gestión de ciclos anuales de producción</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="h-5 w-5" />
          Nueva Campaña
        </Button>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campanasData.map((campana) => (
          <Card
            key={campana.id}
            className="border-border/50 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground">Campaña {campana.año}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(campana.fechaInicio).toLocaleDateString("es-AR")} -{" "}
                    {new Date(campana.fechaFin).toLocaleDateString("es-AR")}
                  </p>
                </div>
                {campana.estado === "Activa" ? (
                  <Badge className="bg-accent text-accent-foreground">Activa</Badge>
                ) : (
                  <Badge variant="secondary">Finalizada</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-secondary">
                    <Calendar className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duración</p>
                    <p className="text-lg font-semibold text-foreground">12 meses</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-secondary">
                    <TrendingUp className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Producción</p>
                    <p className="text-lg font-semibold text-foreground">{campana.produccion.toLocaleString()} kg</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-secondary">
                    <TrendingUp className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ingresos</p>
                    <p className="text-lg font-semibold text-accent">${campana.ingresos.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex gap-2">
                <Button variant="outline" className="flex-1">
                  Ver Producción
                </Button>
                <Button variant="outline" className="flex-1">
                  Ver Costos
                </Button>
                <Button variant="outline" className="flex-1">
                  Ver Inversiones
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {campanasData.length === 0 && (
        <Card className="border-border/50 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No hay campañas registradas</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Crea tu primera campaña para comenzar a registrar producción, costos e inversiones
            </p>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="h-5 w-5" />
              Crear Primera Campaña
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Campanas;
