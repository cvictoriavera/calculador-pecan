import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const costosData = [
  { id: 1, año: 2025, categoria: "Insumos", descripcion: "Fertilizantes", monto: 15000 },
  { id: 2, año: 2025, categoria: "Insumos", descripcion: "Herbicidas", monto: 8000 },
  { id: 3, año: 2025, categoria: "Labores", descripcion: "Mano de obra", monto: 25000 },
  { id: 4, año: 2025, categoria: "Labores", descripcion: "Combustible", monto: 10000 },
  { id: 5, año: 2025, categoria: "Energía", descripcion: "Electricidad riego", monto: 6000 },
  { id: 6, año: 2025, categoria: "Cosecha", descripcion: "Contratistas", monto: 8000 },
];

const categoriaColors: Record<string, string> = {
  Insumos: "#CF7E3C",
  Labores: "#5C4844",
  Energía: "#F9A300",
  Cosecha: "#846761",
  Administración: "#2F2928",
};

const Costos = () => {
  const totalCostos = costosData.reduce((acc, cost) => acc + cost.monto, 0);

  // Prepare data for pie chart
  const costoPorCategoria = costosData.reduce((acc, cost) => {
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Costos Operativos (Opex)</h1>
          <p className="text-muted-foreground">Registro de gastos operacionales</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="h-5 w-5" />
          Nuevo Costo
        </Button>
      </div>

      {/* Summary and Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-md bg-gradient-to-br from-card to-secondary/30">
          <CardHeader>
            <CardTitle className="text-foreground">Resumen de Costos 2025</CardTitle>
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
          </CardContent>
        </Card>
      </div>

      {/* Costs Table */}
      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-foreground">Registro de Costos</CardTitle>
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
                {costosData.map((costo) => (
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
    </div>
  );
};

export default Costos;
