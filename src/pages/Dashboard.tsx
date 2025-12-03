import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Sprout, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

const productionData = [
  { year: "2020", produccion: 1200, ingresos: 84000 },
  { year: "2021", produccion: 1800, ingresos: 126000 },
  { year: "2022", produccion: 2100, ingresos: 147000 },
  { year: "2023", produccion: 2500, ingresos: 175000 },
  { year: "2024", produccion: 2800, ingresos: 196000 },
  { year: "2025", produccion: 3200, ingresos: 224000 },
];

const paybackData = [
  { year: "2020", ingresos: 84000, costos: 45000, inversiones: 120000, flujoAcumulado: -81000 },
  { year: "2021", ingresos: 126000, costos: 52000, inversiones: 30000, flujoAcumulado: -37000 },
  { year: "2022", ingresos: 147000, costos: 58000, inversiones: 20000, flujoAcumulado: 32000 },
  { year: "2023", ingresos: 175000, costos: 62000, inversiones: 15000, flujoAcumulado: 130000 },
  { year: "2024", ingresos: 196000, costos: 68000, inversiones: 10000, flujoAcumulado: 248000 },
  { year: "2025", ingresos: 224000, costos: 72000, inversiones: 8000, flujoAcumulado: 392000 },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Inicio</h1>
        <p className="text-muted-foreground">Visión general de tu operación pecanera</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Producción Total</CardTitle>
            <Sprout className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">3,200 kg</div>
            <p className="text-xs text-accent mt-1">+14.3% vs. año anterior</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos 2025</CardTitle>
            <DollarSign className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$224,000</div>
            <p className="text-xs text-accent mt-1">+14.3% vs. 2024</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Costos Operativos</CardTitle>
            <TrendingUp className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$72,000</div>
            <p className="text-xs text-muted-foreground mt-1">32% de los ingresos</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payback</CardTitle>
            <BarChart3 className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">2022</div>
            <p className="text-xs text-muted-foreground mt-1">Recupero de inversión</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground">Evolución de Producción</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="produccion" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground">Análisis de Payback</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={paybackData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="ingresos" stroke="hsl(var(--accent))" strokeWidth={2} name="Ingresos" />
                <Line type="monotone" dataKey="costos" stroke="hsl(var(--warning))" strokeWidth={2} name="Costos" />
                <Line
                  type="monotone"
                  dataKey="flujoAcumulado"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Flujo Acumulado"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payback Table */}
      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-foreground">Tabla Payback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Campaña</th>
                  <th className="text-right p-3 text-sm font-semibold text-muted-foreground">Ingresos</th>
                  <th className="text-right p-3 text-sm font-semibold text-muted-foreground">Costos Op.</th>
                  <th className="text-right p-3 text-sm font-semibold text-muted-foreground">Inversiones</th>
                  <th className="text-right p-3 text-sm font-semibold text-muted-foreground">Flujo Caja</th>
                  <th className="text-right p-3 text-sm font-semibold text-muted-foreground">Flujo Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {paybackData.map((row) => {
                  const flujoCaja = row.ingresos - row.costos - row.inversiones;
                  return (
                    <tr key={row.year} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="p-3 text-sm font-medium text-foreground">{row.year}</td>
                      <td className="p-3 text-sm text-right text-accent font-semibold">
                        ${row.ingresos.toLocaleString()}
                      </td>
                      <td className="p-3 text-sm text-right text-foreground">${row.costos.toLocaleString()}</td>
                      <td className="p-3 text-sm text-right text-foreground">${row.inversiones.toLocaleString()}</td>
                      <td className="p-3 text-sm text-right text-foreground font-medium">
                        ${flujoCaja.toLocaleString()}
                      </td>
                      <td
                        className={`p-3 text-sm text-right font-bold ${
                          row.flujoAcumulado >= 0 ? "text-accent" : "text-destructive"
                        }`}
                      >
                        ${row.flujoAcumulado.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
