import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  Scale, 
  Trees, 
  DollarSign, 
  ArrowRight,
  PieChart as PieChartIcon,
  Table2
} from "lucide-react";
import { 
  ResponsiveContainer, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

const COST_DISTRIBUTION = [
  { name: "Mano de Obra", value: 87704, percentage: "37.2%", color: "#b45309" },
  { name: "Insumos", value: 43912, percentage: "18.6%", color: "#0284c7" },
  { name: "Administración", value: 39431, percentage: "16.7%", color: "#ec4899" },
  { name: "Cosecha", value: 24760, percentage: "10.5%", color: "#10b981" },
  { name: "Energía", value: 20428, percentage: "8.7%", color: "#6366f1" },
  { name: "Combustible", value: 12954, percentage: "5.5%", color: "#eab308" },
  { name: "Mantenimiento", value: 6544, percentage: "2.8%", color: "#64748b" },
];

const PROVINCE_DISTRIBUTION = [
  { name: "Córdoba", has: 31.6, fincas: 2, produccion: 25590 },
  { name: "Buenos Aires", has: 23.3, fincas: 2, produccion: 7198 },
  { name: "Tucumán", has: 14.0, fincas: 1, produccion: 11592 },
];

export default function ResumenEjecutivo() {
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground m-0">
              Resumen Ejecutivo
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold px-2.5 py-0.5">
              Panel Estadístico
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Visión global consolidada del clúster de productores de pecán, rendimientos y costos.
          </p>
        </div>

        <Button
          onClick={() => navigate("/indicadores")}
          className="gap-2 bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90"
        >
          <Table2 className="w-4 h-4" />
          <span>Ver Tablas de Indicadores</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-medium text-muted-foreground">Superficie Total Monitoreada</span>
            <Trees className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground">68.9 Has</div>
            <p className="text-xs text-muted-foreground mt-1">
              Distribuido en <span className="font-semibold text-foreground">5 fincas</span> (Córdoba, BsAs, Tucumán)
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-medium text-muted-foreground">Volumen de Cosecha Total</span>
            <Scale className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground">44,380 Kg</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Rendimiento promedio: 644 kg/ha
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-medium text-muted-foreground">Costo Total Operativo</span>
            <DollarSign className="w-4 h-4 text-rose-600" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground">$ 235,733 USD</div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio: <span className="font-semibold text-foreground">$ 3,421 / Ha</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-medium text-muted-foreground">Costo Unitario por Kilo</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground">$ 5.31 USD/Kg</div>
            <p className="text-xs text-muted-foreground mt-1">
              Rango: <span className="font-semibold text-foreground">$ 4.16 - $ 10.47</span> / Kg
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Cost Distribution and Regional Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Distribution Chart */}
        <Card className="border shadow-xs lg:col-span-2">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Estructura Porcentual de Costos
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Distribución total del gasto acumulado ($235,733 USD)
                </p>
              </div>
              <PieChartIcon className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 items-center gap-4">
            <div className="h-[240px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={COST_DISTRIBUTION}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {COST_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: number) => [`$ ${val.toLocaleString()} USD`, "Costo"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs">
              {COST_DISTRIBUTION.map((item) => (
                <div key={item.name} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-foreground">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-mono">$ {item.value.toLocaleString()}</span>
                    <span className="font-bold text-foreground w-12 text-right">{item.percentage}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Regional Analysis */}
        <Card className="border shadow-xs">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-base font-semibold text-foreground">
              Distribución por Provincia
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Superficie y producción por provincia
            </p>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {PROVINCE_DISTRIBUTION.map((prov) => (
              <div key={prov.name} className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground">{prov.name}</span>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {prov.fincas} {prov.fincas === 1 ? 'finca' : 'fincas'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Superficie:</span>
                    <span className="font-bold text-foreground">{prov.has} Has</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Producción:</span>
                    <span className="font-bold text-emerald-600">{prov.produccion.toLocaleString()} Kg</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => navigate("/indicadores")}
                className="w-full text-xs gap-2"
              >
                <span>Explorar Indicadores Detallados</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
