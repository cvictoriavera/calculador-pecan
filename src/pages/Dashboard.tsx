import { useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Sprout, BarChart3, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { useApp } from "@/contexts/AppContext";
import { useCalculationsStore } from "@/stores/calculationsStore";
import { formatCurrency } from "@/lib/calculations"; 
import { useDataStore } from "@/stores"; 

const Dashboard = () => {
  // 1. Traemos las campañas
  const { campaigns, campaignsLoading } = useApp();
  
  // 2. IMPORTANTE: Nos suscribimos a los datos crudos para que el componente
  // se actualice cuando terminen de cargarse desde el servidor.
  const { 
    costs, 
    investments, 
    productions,
    loadAllProductions,  // <--- Necesario para traer la producción // <--- Recomendado para asegurar inversiones
  } = useDataStore();

  // 3. Traemos las funciones de cálculo
  const { getTotalCostsByCampaign, getTotalInvestmentsByCampaign } = useCalculationsStore();

  useEffect(() => {
    if (campaigns && campaigns.length > 0) {
      loadAllProductions(campaigns);
    }
  }, [campaigns, loadAllProductions]);

  /// 4. Calculamos los datos. Agregamos 'costs', 'investments' y 'productions' a las dependencias.
  const dashboardData = useMemo(() => {
    if (!campaigns || campaigns.length === 0) return [];

    const sortedCampaigns = [...campaigns].sort((a, b) => a.year - b.year);
    let acumulado = 0;

    return sortedCampaigns.map((camp) => {
      // CAMBIO: Calcular producción real sumando el array 'productions'
      const production = productions
        .filter(p => String(p.campaign_id) === String(camp.id))
        .reduce((sum, p) => sum + Number(p.quantity_kg || 0), 0);

      const price = parseFloat(camp.average_price || "0");
      const ingresos = production * price; // Esto arregla Ingresos y Payback automáticamente

      const costosCamp = getTotalCostsByCampaign(camp.id);
      const inversionesCamp = getTotalInvestmentsByCampaign(camp.id);

      const flujoCaja = ingresos - costosCamp - inversionesCamp;
      acumulado += flujoCaja;

      return {
        year: camp.year.toString(),
        produccion: production,
        ingresos: ingresos,
        costos: costosCamp,
        inversiones: inversionesCamp,
        flujoCaja: flujoCaja,
        flujoAcumulado: acumulado,
        id: camp.id
      };
    });
  }, [campaigns, getTotalCostsByCampaign, getTotalInvestmentsByCampaign, costs, investments, productions]);

  // 3. Calculamos KPIs Generales (Totales o del año actual)
  const kpis = useMemo(() => {
    if (dashboardData.length === 0) return null;

    // Último año registrado (normalmente el actual o proyección futura)
    const currentYearData = dashboardData[dashboardData.length - 1];
    const previousYearData = dashboardData.length > 1 ? dashboardData[dashboardData.length - 2] : null;

    // Cálculo simple de variaciones (evitando división por cero)
    const getVariation = (current: number, previous: number) => {
      if (!previous) return 0;
      return ((current - previous) / previous) * 100;
    };

    // Año de Payback (primer año donde el acumulado se vuelve positivo)
    const paybackYearObj = dashboardData.find(d => d.flujoAcumulado >= 0);
    const paybackYear = paybackYearObj ? paybackYearObj.year : "N/A";

    return {
      produccionTotal: currentYearData.produccion,
      produccionVar: previousYearData ? getVariation(currentYearData.produccion, previousYearData.produccion) : 0,
      ingresosTotal: currentYearData.ingresos,
      ingresosVar: previousYearData ? getVariation(currentYearData.ingresos, previousYearData.ingresos) : 0,
      costosTotal: currentYearData.costos,
      costosRatio: currentYearData.ingresos ? (currentYearData.costos / currentYearData.ingresos) * 100 : 0,
      paybackYear
    };
  }, [dashboardData]);

  if (campaignsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Si no hay datos, mostrar estado vacío
  if (dashboardData.length === 0) {
     return (
        <div className="text-center py-10">
           <h2 className="text-xl ">No hay datos registrados</h2>
           <p className="text-muted-foreground">Comienza creando una campaña y registrando movimientos.</p>
        </div>
     )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-foreground mb-2">Inicio</h1>
        <p className="text-muted-foreground">Visión general de tu operación pecanera</p>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Producción {dashboardData[dashboardData.length - 1].year}</CardTitle>
              <Sprout className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{kpis.produccionTotal.toLocaleString()} kg</div>
              <p className={`text-xs mt-1 ${kpis.produccionVar >= 0 ? "text-accent" : "text-destructive"}`}>
                {kpis.produccionVar > 0 ? "+" : ""}{kpis.produccionVar.toFixed(1)}% vs. año anterior
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos {dashboardData[dashboardData.length - 1].year}</CardTitle>
              <DollarSign className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${kpis.ingresosTotal.toLocaleString()}</div>
              <p className={`text-xs mt-1 ${kpis.ingresosVar >= 0 ? "text-accent" : "text-destructive"}`}>
                 {kpis.ingresosVar > 0 ? "+" : ""}{kpis.ingresosVar.toFixed(1)}% vs. año anterior
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Costos Operativos</CardTitle>
              <TrendingUp className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${kpis.costosTotal.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{kpis.costosRatio.toFixed(1)}% de los ingresos</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Payback Estimado</CardTitle>
              <BarChart3 className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{kpis.paybackYear}</div>
              <p className="text-xs text-muted-foreground mt-1">Recupero de inversión</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground">Evolución de Producción</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {/* Usamos dashboardData en lugar de productionData */}
              <BarChart data={dashboardData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`${value} kg`, "Producción"]}
                />
                <Bar dataKey="produccion" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} name="Producción" />
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
               {/* Usamos dashboardData en lugar de paybackData */}
              <LineChart data={dashboardData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`$${value.toLocaleString()}`, ""]}
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
                {dashboardData.map((row) => {
                  return (
                    <tr key={row.year} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="p-3 text-sm font-medium text-foreground">{row.year}</td>
                      <td className="p-3 text-sm text-right text-accent font-semibold">
                      {formatCurrency(row.ingresos)}
                      </td>
                      <td className="p-3 text-sm text-right text-foreground">
                      {formatCurrency(row.costos)}
                      </td>
                      <td className="p-3 text-sm text-right text-foreground">
                        ${row.inversiones.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="p-3 text-sm text-right text-foreground font-medium">
                        ${row.flujoCaja.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td
                        className={`p-3 text-sm text-right font-bold ${
                          row.flujoAcumulado >= 0 ? "text-accent" : "text-destructive"
                        }`}
                      >
                        ${row.flujoAcumulado.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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