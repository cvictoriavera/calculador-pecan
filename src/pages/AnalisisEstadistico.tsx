import { useMemo, useState, useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { 
  getRegionalStats, 
  getResumenStats, 
  type RegionalStat, 
  type ResumenKPIs, 
  type ResumenTendenciaData, 
  type CostRankingItem 
} from "@/services/statsService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  TrendingUp,
  DollarSign,
  Activity,
  Users,
  Trees,
  Download,
  Loader2
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from "recharts";

const variedadesData = [
  { name: "Pawnee", value: 42, color: "#10b981" },
  { name: "Stuart", value: 28, color: "#f59e0b" },
  { name: "Mahan", value: 15, color: "#3b82f6" },
  { name: "Desirable", value: 10, color: "#8b5cf6" },
  { name: "Otras", value: 5, color: "#6b7280" },
];

const benchmarkData = [
  { name: "Argentina", costo: 2.10, precio: 3.85 },
  { name: "Brasil", costo: 2.80, precio: 4.10 },
  { name: "Uruguay", costo: 1.95, precio: 3.90 },
];

const historicoData = [
  { year: "2017", costo: 1.65, ingresos: 2.80 },
  { year: "2018", costo: 1.70, ingresos: 2.95 },
  { year: "2019", costo: 1.80, ingresos: 3.10 },
  { year: "2020", costo: 1.75, ingresos: 2.75 },
  { year: "2021", costo: 1.90, ingresos: 3.10 },
  { year: "2022", costo: 2.05, ingresos: 3.45 },
  { year: "2023", costo: 2.15, ingresos: 3.20 },
  { year: "2024", costo: 2.10, ingresos: 3.60 },
  { year: "2025", costo: 2.20, ingresos: 3.85 },
  { year: "2026 (Est.)", costo: 2.25, ingresos: 3.95 },
];

export default function AnalisisEstadistico() {
  const { user, isLoading } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "resumen";

  const [regionesData, setRegionesData] = useState<RegionalStat[]>([]);
  const [isLoadingRegiones, setIsLoadingRegiones] = useState<boolean>(true);

  const [resumenKPIs, setResumenKPIs] = useState<ResumenKPIs | null>(null);
  const [resumenData, setResumenData] = useState<ResumenTendenciaData[]>([]);
  const [rankingCostos, setRankingCostos] = useState<CostRankingItem[]>([]);
  const [isLoadingResumen, setIsLoadingResumen] = useState<boolean>(true);

  const isAdmin = useMemo(() => {
    return user?.roles?.includes("administrator") || false;
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      setIsLoadingRegiones(true);
      getRegionalStats()
        .then((data) => {
          setRegionesData(data || []);
        })
        .catch((err) => {
          console.error("Error al obtener estadísticas regionales:", err);
          toast.error("No se pudieron cargar las estadísticas regionales.");
        })
        .finally(() => {
          setIsLoadingRegiones(false);
        });

      setIsLoadingResumen(true);
      getResumenStats()
        .then((res) => {
          setResumenKPIs(res.kpis);
          setResumenData(res.resumenData || []);
          setRankingCostos(res.rankingCostos || []);
        })
        .catch((err) => {
          console.error("Error al obtener resumen ejecutivo:", err);
          toast.error("No se pudieron cargar las estadísticas del resumen ejecutivo.");
        })
        .finally(() => {
          setIsLoadingResumen(false);
        });
    }
  }, [isAdmin]);

  const handleExport = () => {
    toast.success("Generando reporte estadístico. Se descargará automáticamente en unos segundos...");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando credenciales...</p>
        </div>
      </div>
    );
  }

  // Redirigir si no es administrador
  if (!isAdmin) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground m-0">Análisis Estadístico</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Panel administrativo de estadísticas agregadas, benchmarking sectorial y evolución histórica.
          </p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2 self-start sm:self-auto bg-primary text-primary-foreground hover:bg-primary/95 shadow">
          <Download className="h-4 w-4" />
          Exportar Datos
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={currentTab}
        onValueChange={(value) => setSearchParams({ tab: value })}
        className="space-y-6"
      >
        <TabsList className="w-full sm:w-auto p-1 bg-muted/80 flex overflow-x-auto sm:inline-flex justify-start sm:justify-center rounded-md ">
          <TabsTrigger value="resumen" className="rounded-sm font-medium text-xs sm:text-sm px-4 py-1.5">
            Resumen Ejecutivo
          </TabsTrigger>
          <TabsTrigger value="interno" className="rounded-sm font-medium text-xs sm:text-sm px-4 py-1.5">
            Análisis Interno
          </TabsTrigger>
          <TabsTrigger value="benchmarking" className="rounded-sm font-medium text-xs sm:text-sm px-4 py-1.5">
            Benchmarking Internacional
          </TabsTrigger>
          <TabsTrigger value="evolucion" className="rounded-sm font-medium text-xs sm:text-sm px-4 py-1.5">
            Evolución Histórica
          </TabsTrigger>
        </TabsList>

        {/* Tab CONTENT: Resumen Ejecutivo */}
        <TabsContent value="resumen" className="space-y-6 outline-none">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/50 shadow hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rubro de mayor peso</CardTitle>
                <Trees className="h-5 w-5 text-emerald-600" />
              </CardHeader>
              <CardContent>
                {isLoadingResumen ? (
                  <div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> Cargando...
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {resumenKPIs?.rubroMayorPeso?.name || "N/A"}
                    </div>
                    <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                      <TrendingUp className="h-3 w-3" />
                      {resumenKPIs?.rubroMayorPeso?.porcentaje
                        ? `${resumenKPIs.rubroMayorPeso.porcentaje}% del costo total`
                        : "Sin costos registrados"}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Costo productivo Promedio</CardTitle>
                <DollarSign className="h-5 w-5 text-sky-600" />
              </CardHeader>
              <CardContent>
                {isLoadingResumen ? (
                  <div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> Cargando...
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      U$S {resumenKPIs?.costoProductivoPromedio ? resumenKPIs.costoProductivoPromedio.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"} / kg
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                      Promedio general de proyectos activos
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Costo por Ha Promedio</CardTitle>
                <Activity className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                {isLoadingResumen ? (
                  <div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> Cargando...
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      U$S {resumenKPIs?.costoPorHaPromedio ? resumenKPIs.costoPorHaPromedio.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"} / ha
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                      Promedio en montes registrados
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Productores Activos</CardTitle>
                <Users className="h-5 w-5 text-indigo-600" />
              </CardHeader>
              <CardContent>
                {isLoadingResumen ? (
                  <div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> Cargando...
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {resumenKPIs?.productoresActivos ?? 0} Productores
                    </div>
                    <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                      Registrados en la plataforma
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Central Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-border/50 shadow">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Tendencia de Producción y Precios FOB</CardTitle>
                <CardDescription>Comparativa de volumen estimado nacional vs. cotización promedio del pecán por campaña.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingResumen ? (
                  <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /> Cargando tendencia...
                  </div>
                ) : resumenData.length === 0 ? (
                  <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">
                    No hay campañas ni datos de producción registrados en la base de datos.
                  </div>
                ) : (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={resumenData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" tickLine={false} axisLine={false} label={{ value: 'Volumen (kg/Ton)', angle: -90, position: 'insideLeft', style: { fill: 'gray', fontSize: 12 } }} />
                        <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} label={{ value: 'FOB Promedio (U$S/kg)', angle: 90, position: 'insideRight', style: { fill: 'gray', fontSize: 12 } }} />
                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #ccc', borderRadius: 8 }} />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Area yAxisId="left" type="monotone" dataKey="produccion" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorProd)" name="Producción Acumulada" strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="precio" stroke="#38bdf8" strokeWidth={3} name="FOB Promedio (U$S/kg)" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Side Card: Cost Ranking */}
            <Card className="border-border/50 shadow flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Ranking de Costos por Rubro
                </CardTitle>
                <CardDescription>
                  Distribución porcentual de los costos operativos totales acumulados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 flex-1">
                {isLoadingResumen ? (
                  <div className="h-full min-h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" /> Cargando ranking...
                  </div>
                ) : rankingCostos.length === 0 ? (
                  <div className="h-full min-h-[200px] flex items-center justify-center text-muted-foreground text-sm text-center">
                    No hay costos registrados en la base de datos.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {rankingCostos.map((item) => (
                      <div
                        key={item.rank}
                        className={`flex flex-col px-3 py-1.5 rounded-lg border transition-all ${
                          item.rank === 1
                            ? "bg-amber-500/5 border-amber-500/30 shadow-sm"
                            : item.rank === 2
                            ? "bg-slate-500/5 border-slate-500/30 shadow-sm"
                            : "bg-transparent border-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full ${
                                item.rank === 1
                                  ? "bg-amber-500 text-white"
                                  : item.rank === 2
                                  ? "bg-slate-400 text-white"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {item.rank}
                            </span>
                            <span
                              className={`text-xs ${
                                item.rank <= 2 ? "font-bold text-foreground" : "text-muted-foreground font-medium"
                              }`}
                            >
                              {item.name}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-semibold ${
                              item.rank === 1
                                ? "text-amber-600 font-bold"
                                : item.rank === 2
                                ? "text-slate-600 font-bold"
                                : "text-foreground"
                            }`}
                          >
                            {item.porcentaje.toFixed(1)}%
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.rank === 1
                                ? "bg-amber-500"
                                : item.rank === 2
                                ? "bg-slate-400"
                                : item.color || "bg-primary/65"
                            }`}
                            style={{ width: `${item.porcentaje}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab CONTENT: Análisis Interno */}
        <TabsContent value="interno" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Variety Distribution Chart */}
            <Card className="border-border/50 shadow">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Distribución por Variedades</CardTitle>
                <CardDescription>Proporción de hectáreas implantadas por variedad registrada.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-[250px] w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={variedadesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {variedadesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Central Text */}
                  <div className="absolute text-center">
                    <span className="text-3xl font-extrabold text-foreground">Pawnee</span>
                    <p className="text-xs text-muted-foreground m-0">Líder con 42%</p>
                  </div>
                </div>

                {/* Legend list */}
                <div className="w-full grid grid-cols-2 gap-2 mt-4 text-xs">
                  {variedadesData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="font-medium text-foreground truncate">{entry.name} ({entry.value}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Regional Table details */}
            <Card className="lg:col-span-2 border-border/50 shadow">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Radiografía Regional de Producción</CardTitle>
                <CardDescription>Información demográfica y de productividad agrupada por zonas.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-border/70 text-muted-foreground font-medium">
                        <th className="pb-3 font-semibold">Región</th>
                        <th className="pb-3 text-right font-semibold">Superficie (ha)</th>
                        <th className="pb-3 text-right font-semibold">Productores</th>
                        <th className="pb-3 text-right font-semibold">Rend. Promedio (kg/ha)</th>
                        <th className="pb-3 text-right font-semibold">Participación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {isLoadingRegiones ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin inline-block mr-2 text-primary" />
                            Cargando datos regionales desde la base de datos...
                          </td>
                        </tr>
                      ) : regionesData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground">
                            No hay proyectos ni datos regionales registrados en la base de datos.
                          </td>
                        </tr>
                      ) : (
                        regionesData.map((row, idx) => {
                          const totalHa = regionesData.reduce((sum, r) => sum + r.hectareas, 0);
                          const share = totalHa > 0 ? ((row.hectareas / totalHa) * 100).toFixed(1) : "0.0";
                          return (
                            <tr key={idx} className="hover:bg-muted/30 transition-colors">
                              <td className="py-3 font-medium text-foreground flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary" />
                                {row.region}
                              </td>
                              <td className="py-3 text-right font-mono">{row.hectareas.toLocaleString()} ha</td>
                              <td className="py-3 text-right font-mono">{row.productores}</td>
                              <td className="py-3 text-right font-mono">{row.rendimiento.toLocaleString()} kg</td>
                              <td className="py-3 text-right">
                                <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-semibold">
                                  {share}%
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab CONTENT: Benchmarking Internacional */}
        <TabsContent value="benchmarking" className="space-y-6 outline-none">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart comparison */}
            <Card className="lg:col-span-2 border-border/50 shadow">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Costos produccion vs. Costos por hectáreas plantadas</CardTitle>
                <CardDescription>Evaluación del margen unitario por país exportador.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={benchmarkData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} label={{ value: 'U$S por Kilogramo', angle: -90, position: 'insideLeft', style: { fill: 'gray', fontSize: 12 } }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="costo" fill="#ef4444" name="Costo Producción (U$S/kg)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="precio" fill="hsl(var(--primary))" name="Costo por Ha (U$S/ha)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Benchmarking Metrics Table */}
            <Card className="border-border/50 shadow">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Matriz de Competitividad</CardTitle>
                <CardDescription>Métricas clave estimadas para montes adultos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs pb-1 border-b border-border/40 font-semibold text-muted-foreground">
                    <span>Indicador</span>
                    <span>Argentina (CAPPECAN)</span>
                    <span>Líder (EE.UU.)</span>
                  </div>

                  <div className="flex justify-between items-center text-sm py-1 border-b border-border/30">
                    <span className="text-muted-foreground">Rend. Adulto (kg/ha)</span>
                    <span className="font-semibold text-foreground">1,980 kg</span>
                    <span className="text-foreground">2,300 kg</span>
                  </div>

                  <div className="flex justify-between items-center text-sm py-1 border-b border-border/30">
                    <span className="text-muted-foreground">Calidad (% Almendra)</span>
                    <span className="font-semibold text-foreground">53% - 55%</span>
                    <span className="text-foreground">50% - 52%</span>
                  </div>

                  <div className="flex justify-between items-center text-sm py-1 border-b border-border/30">
                    <span className="text-muted-foreground">Costo Unitario (U$S/kg)</span>
                    <span className="font-semibold text-emerald-600">U$S 2.10</span>
                    <span className="text-foreground">U$S 2.80</span>
                  </div>

                  <div className="flex justify-between items-center text-sm py-1 border-b border-border/30">
                    <span className="text-muted-foreground">Margen Neto (U$S/kg)</span>
                    <span className="font-semibold text-emerald-600">U$S 1.75</span>
                    <span className="text-foreground">U$S 1.30</span>
                  </div>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground border border-border/50">
                  <h5 className="font-semibold text-foreground mb-1">Ventaja Competitiva Local:</h5>
                  Argentina presenta costos operativos más bajos debido al menor costo de tierra y mano de obra, complementado con una excelente calidad de llenado del fruto (% de almendra), logrando márgenes competitivos a pesar de rendimientos ligeramente menores.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab CONTENT: Evolución Histórica */}
        <TabsContent value="evolucion" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 10-Year historical Evolution chart */}
            <Card className="lg:col-span-2 border-border/50 shadow">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Evolución de Costos e Ingresos de Exportación (10 Años)</CardTitle>
                <CardDescription>Seguimiento de la rentabilidad histórica del sector (valores de referencia en U$S).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicoData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="year" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} label={{ value: 'Valor (U$S/kg)', angle: -90, position: 'insideLeft', style: { fill: 'gray', fontSize: 12 } }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="ingresos" stroke="hsl(var(--primary))" strokeWidth={3} name="Ingreso de Venta FOB (Promedio)" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="costo" stroke="#f43f5e" strokeWidth={2} name="Costo Medio Estimado" strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Timeline sector landmarks */}
            <Card className="border-border/50 shadow">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Hitos Históricos del Sector</CardTitle>
                <CardDescription>Eventos clave que marcaron la evolución de la cadena de valor.</CardDescription>
              </CardHeader>
              <CardContent className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-muted-foreground/20">

                {/* Milestone 1 */}
                <div className="relative">
                  <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background" />
                  <div className="text-xs text-muted-foreground font-semibold">2018</div>
                  <h4 className="text-sm font-semibold text-foreground mt-0.5">Apertura del Mercado Asiático</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Habilitación de protocolos fitosanitarios clave que abrieron canales de exportación a China y Vietnam.
                  </p>
                </div>

                {/* Milestone 2 */}
                <div className="relative">
                  <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-background" />
                  <div className="text-xs text-muted-foreground font-semibold">2021</div>
                  <h4 className="text-sm font-semibold text-foreground mt-0.5">Primera Exportación Consolidada</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Los socios de CAPPECAN coordinaron el primer envío masivo en contenedor conjunto, reduciendo costos operativos.
                  </p>
                </div>

                {/* Milestone 3 */}
                <div className="relative">
                  <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-sky-500 border-2 border-background" />
                  <div className="text-xs text-muted-foreground font-semibold">2024</div>
                  <h4 className="text-sm font-semibold text-foreground mt-0.5">Lanzamiento de CalculadorPecan</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Digitalización de la gestión operativa en fincas y estimación de costos dinámicos en la plataforma.
                  </p>
                </div>

                {/* Milestone 4 */}
                <div className="relative">
                  <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-background" />
                  <div className="text-xs text-muted-foreground font-semibold">2026</div>
                  <h4 className="text-sm font-semibold text-foreground mt-0.5">Récord Histórico de Exportación</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Proyección de volumen de ventas superior a las 1,200 toneladas con cáscara.
                  </p>
                </div>

              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
