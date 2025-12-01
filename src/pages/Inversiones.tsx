import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const inversionesData = [
  { id: 1, año: 2025, categoria: "Maquinaria", descripcion: "Shaker nuevo", monto: 8000 },
  { id: 2, año: 2024, categoria: "Riego", descripcion: "Sistema de riego por goteo", monto: 10000 },
  { id: 3, año: 2023, categoria: "Maquinaria", descripcion: "Tractor John Deere", monto: 15000 },
  { id: 4, año: 2022, categoria: "Plantación", descripcion: "Nuevos árboles Lote Oeste", monto: 20000 },
  { id: 5, año: 2021, categoria: "Maquinaria", descripcion: "Acoplado para cosecha", monto: 30000 },
];

const categoriaColors: Record<string, string> = {
  Tierra: "bg-cocoa",
  Plantación: "bg-accent",
  Riego: "bg-primary",
  Maquinaria: "bg-warning",
};

const Inversiones = () => {
  const totalInversiones = inversionesData.reduce((acc, inv) => acc + inv.monto, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Inversiones (Capex)</h1>
          <p className="text-muted-foreground">Registro de inversiones de capital</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="h-5 w-5" />
          Nueva Inversión
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="border-border/50 shadow-md bg-gradient-to-br from-card to-secondary/30">
        <CardHeader>
          <CardTitle className="text-foreground">Resumen de Inversiones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Invertido (histórico)</p>
              <p className="text-4xl font-bold text-foreground">${totalInversiones.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investments Table */}
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
                {inversionesData.map((inversion) => (
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
                      ${inversion.monto.toLocaleString()}
                    </td>
                    <td className="p-3 text-sm text-center">
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {inversionesData.length === 0 && (
        <Card className="border-border/50 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingDown className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No hay inversiones registradas</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Comienza registrando tus inversiones de capital para el análisis de payback
            </p>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="h-5 w-5" />
              Registrar Primera Inversión
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Inversiones;
