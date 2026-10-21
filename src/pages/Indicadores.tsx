import { useState, useMemo } from "react";
import { 
  PRODUCTORES_TOTALES, 
  TOTAL_GENERAL, 
  TABLA_POR_HA, 
  TOTAL_POR_HA, 
  TABLA_POR_KILO, 
  TOTAL_POR_KILO,
} from "@/data/indicadoresData";
import type { FormattedRowItem, ProductorData } from "@/data/indicadoresData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Search, 
  Download, 
  Printer, 
  Scale, 
  TrendingUp, 
  Layers, 
  Building2, 
  Trees, 
  CircleDollarSign,
  Palette,
  BarChart3,
  Table as TableIcon
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";

// Helper formatters
const formatNumber = (num: number | null | undefined, decimals = 0) => {
  if (num === null || num === undefined) return "-";
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

const formatUSD = (num: number | null | undefined, showSymbol = true) => {
  if (num === null || num === undefined) return "-";
  const formatted = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(num);
  return showSymbol ? `$ ${formatted}` : formatted;
};

// Helper for conditional styling
const getCellBgClass = (color?: string, semaforoEnabled = true) => {
  if (!semaforoEnabled || !color || color === 'neutral') return "";
  switch (color) {
    case 'green':
      return "bg-[#c6efce] text-[#006100] font-medium";
    case 'yellow':
      return "bg-[#ffeb9c] text-[#9c6500] font-medium";
    case 'red':
      return "bg-[#ffc7ce] text-[#9c0006] font-medium";
    default:
      return "";
  }
};

export default function Indicadores() {
  const [search, setSearch] = useState("");
  const [selectedProvincia, setSelectedProvincia] = useState<string>("TODAS");
  const [semaforoEnabled, setSemaforoEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState("todas");

  // Filter producers
  const filteredTotales = useMemo(() => {
    return PRODUCTORES_TOTALES.filter(p => {
      const matchSearch = p.productor.toLowerCase().includes(search.toLowerCase()) ||
                          p.finca.toLowerCase().includes(search.toLowerCase());
      const matchProv = selectedProvincia === "TODAS" || p.provincia.toLowerCase() === selectedProvincia.toLowerCase();
      return matchSearch && matchProv;
    });
  }, [search, selectedProvincia]);

  const filteredHa = useMemo(() => {
    return TABLA_POR_HA.filter(p => {
      const matchSearch = p.productor.toLowerCase().includes(search.toLowerCase()) ||
                          p.finca.toLowerCase().includes(search.toLowerCase());
      const matchProv = selectedProvincia === "TODAS" || p.provincia.toLowerCase() === selectedProvincia.toLowerCase();
      return matchSearch && matchProv;
    });
  }, [search, selectedProvincia]);

  const filteredKilo = useMemo(() => {
    return TABLA_POR_KILO.filter(p => {
      const matchSearch = p.productor.toLowerCase().includes(search.toLowerCase()) ||
                          p.finca.toLowerCase().includes(search.toLowerCase());
      const matchProv = selectedProvincia === "TODAS" || p.provincia.toLowerCase() === selectedProvincia.toLowerCase();
      return matchSearch && matchProv;
    });
  }, [search, selectedProvincia]);

  // Chart data
  const chartComparisonData = useMemo(() => {
    return PRODUCTORES_TOTALES.map(p => {
      const haRow = TABLA_POR_HA.find(h => h.id === p.id);
      const kgRow = TABLA_POR_KILO.find(k => k.id === p.id);
      return {
        name: p.productor,
        finca: p.finca,
        costoPorHa: Number(haRow?.totalCostos.val || 0),
        costoPorKg: Number(kgRow?.totalCostos.val || 0),
        rendimientoKgHa: Number(haRow?.kilos.val || 0),
        has: p.has,
        kilosTotales: p.kilos,
        totalCostos: p.totalCostos,
        insumos: p.insumos.total,
        mObra: p.mObra,
        combustible: p.combustible,
        energia: p.energia,
        cosecha: p.cosecha,
        adm: p.adm || 0,
        mant: p.mant || 0,
      };
    });
  }, []);

  const handleExportCSV = () => {
    const headers = [
      "Tabla", "Productor", "Finca", "Provincia", "Has", "Kilos", "TOTAL COSTOS",
      "Insumos Total", "Suelo", "Foliares", "Fung", "Herb", "Insect",
      "Combustible", "M Obra", "Energia", "Cosecha", "ADM", "Mant"
    ];

    const rows: string[][] = [];

    // Table 1 rows
    PRODUCTORES_TOTALES.forEach(p => {
      rows.push([
        "TOTALES", p.productor, p.finca, p.provincia, String(p.has), String(p.kilos), String(p.totalCostos),
        String(p.insumos.total), String(p.insumos.suelo || ""), String(p.insumos.foliares || ""),
        String(p.insumos.fung || ""), String(p.insumos.herb || ""), String(p.insumos.insect || ""),
        String(p.combustible), String(p.mObra), String(p.energia), String(p.cosecha),
        String(p.adm || ""), String(p.mant || "")
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "indicadores_pecan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full overflow-hidden print:p-0">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground m-0">
              Indicadores
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold px-2.5 py-0.5">
              Panel Comparativo
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Métricas de costos, rendimientos e insumos por productor, hectárea y kilo producido.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSemaforoEnabled(!semaforoEnabled)}
            className={`gap-1.5 transition-all text-xs h-9 ${
              semaforoEnabled 
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300" 
                : "text-muted-foreground"
            }`}
            title="Activar/Desactivar semáforo de colores"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Semáforo: {semaforoEnabled ? "Activo" : "Inactivo"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs h-9"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs h-9"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:grid-cols-6">
        <Card className="border shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-3.5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span>Productores</span>
            </div>
            <div className="text-xl font-bold text-foreground">5 Fincas</div>
            <div className="text-[11px] text-muted-foreground">3 Provincias</div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-3.5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <Trees className="w-3.5 h-3.5 text-emerald-600" />
              <span>Superficie Total</span>
            </div>
            <div className="text-xl font-bold text-foreground">68.9 Has</div>
            <div className="text-[11px] text-muted-foreground">Prom: 13.8 ha/finca</div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-3.5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <Scale className="w-3.5 h-3.5 text-amber-600" />
              <span>Producción Total</span>
            </div>
            <div className="text-xl font-bold text-foreground">44,380 Kg</div>
            <div className="text-[11px] text-emerald-600 font-medium">644 kg/ha prom</div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-3.5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <CircleDollarSign className="w-3.5 h-3.5 text-rose-600" />
              <span>Costos Totales</span>
            </div>
            <div className="text-xl font-bold text-foreground">$ 235,733</div>
            <div className="text-[11px] text-muted-foreground">USD acumulado</div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-3.5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
              <span>Costo / Hectárea</span>
            </div>
            <div className="text-xl font-bold text-foreground">$ 3,421</div>
            <div className="text-[11px] text-muted-foreground">USD/ha prom</div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-3.5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Costo / Kilo</span>
            </div>
            <div className="text-xl font-bold text-foreground">$ 5.31</div>
            <div className="text-[11px] text-muted-foreground">USD/kg prom</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Tab Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-lg border shadow-xs print:hidden">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por productor o finca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm bg-background"
            />
          </div>
          {search && (
            <Button variant="ghost" size="sm" onClick={() => setSearch("")} className="h-9 px-2 text-xs">
              Limpiar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span>Provincia:</span>
            <div className="flex items-center gap-1">
              {["TODAS", "Córdoba", "Buenos Aires", "Tucumán"].map((prov) => (
                <button
                  key={prov}
                  onClick={() => setSelectedProvincia(prov)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    selectedProvincia === prov
                      ? "bg-primary text-primary-foreground font-medium"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {prov}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b pb-1 print:hidden">
          <TabsList className="bg-muted/70 p-1">
            <TabsTrigger value="todas" className="text-xs gap-1.5">
              <TableIcon className="w-3.5 h-3.5" />
              <span>Todas las Tablas</span>
            </TabsTrigger>
            <TabsTrigger value="totales" className="text-xs">
              Valores Totales
            </TabsTrigger>
            <TabsTrigger value="ha" className="text-xs">
              Por Hectárea (HA)
            </TabsTrigger>
            <TabsTrigger value="kilo" className="text-xs">
              Por Kilo (Kg)
            </TabsTrigger>
            <TabsTrigger value="graficos" className="text-xs gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Gráficos</span>
            </TabsTrigger>
          </TabsList>

          {/* Color legend */}
          {semaforoEnabled && (
            <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground/80">Semáforo:</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-xs bg-[#c6efce] border border-[#006100]/20 inline-block"></span>
                <span>Favorable / Bajo Costo</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-xs bg-[#ffeb9c] border border-[#9c6500]/20 inline-block"></span>
                <span>Intermedio</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-xs bg-[#ffc7ce] border border-[#9c0006]/20 inline-block"></span>
                <span>Elevado / Atención</span>
              </span>
            </div>
          )}
        </div>

        {/* TAB 1: ALL TABLES (Spreadsheet Overview matching image) */}
        <TabsContent value="todas" className="mt-4 space-y-8">
          <TablaTotalesComponent data={filteredTotales} />
          <TablaPorHaComponent data={filteredHa} semaforoEnabled={semaforoEnabled} />
          <TablaPorKiloComponent data={filteredKilo} semaforoEnabled={semaforoEnabled} />
        </TabsContent>

        {/* TAB 2: ONLY TOTALS */}
        <TabsContent value="totales" className="mt-4">
          <TablaTotalesComponent data={filteredTotales} />
        </TabsContent>

        {/* TAB 3: ONLY POR HA */}
        <TabsContent value="ha" className="mt-4">
          <TablaPorHaComponent data={filteredHa} semaforoEnabled={semaforoEnabled} />
        </TabsContent>

        {/* TAB 4: ONLY POR KILO */}
        <TabsContent value="kilo" className="mt-4">
          <TablaPorKiloComponent data={filteredKilo} semaforoEnabled={semaforoEnabled} />
        </TabsContent>

        {/* TAB 5: CHARTS */}
        <TabsContent value="graficos" className="mt-4 space-y-6">
          <GraficosComparativosComponent data={chartComparisonData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==========================================
// COMPONENTE: TABLA 1 - INDICADORES (Totales)
// ==========================================
function TablaTotalesComponent({ data }: { data: ProductorData[] }) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-xs overflow-hidden">
      {/* Table header banner */}
      <div className="bg-muted/40 px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold tracking-wide uppercase text-foreground m-0">
            INDICADORES
          </h2>
          <span className="text-xs text-muted-foreground font-normal">
            (Valores Absolutos Totales en USD)
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">5 Productores analizados</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs select-text">
          <thead>
            {/* Upper Header Row */}
            <tr className="bg-muted/30 text-foreground border-b border-border font-semibold">
              <th rowSpan={2} className="px-3 py-2 text-left border-r border-border min-w-[130px]">Productor</th>
              <th rowSpan={2} className="px-3 py-2 text-left border-r border-border min-w-[130px]">Finca</th>
              <th rowSpan={2} className="px-3 py-2 text-left border-r border-border min-w-[100px]">Provincia</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r border-border min-w-[65px]">Has</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 min-w-[75px]">Kilos</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 bg-primary/5 min-w-[100px] text-foreground font-bold">
                TOTAL COSTOS
              </th>
              {/* Group header: Insumos */}
              <th colSpan={6} className="px-3 py-1.5 text-center border-r-2 border-border/80 bg-muted/40 font-bold border-b border-border">
                Insumos
              </th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 min-w-[85px]">Combustible</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 min-w-[90px]">M Obra</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 min-w-[80px]">Energia</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 min-w-[80px]">cosecha</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 min-w-[85px]">ADM</th>
              <th rowSpan={2} className="px-3 py-2 text-right min-w-[75px]">Mant</th>
            </tr>

            {/* Lower Header Row (Insumos subcolumns) */}
            <tr className="bg-muted/20 text-muted-foreground border-b-2 border-border font-medium text-[11px]">
              <th className="px-2 py-1.5 text-right border-r border-border font-semibold text-foreground">Total</th>
              <th className="px-2 py-1.5 text-right border-r border-border">suelo</th>
              <th className="px-2 py-1.5 text-right border-r border-border">foliares</th>
              <th className="px-2 py-1.5 text-right border-r border-border">fung</th>
              <th className="px-2 py-1.5 text-right border-r border-border">herb</th>
              <th className="px-2 py-1.5 text-right border-r-2 border-border/80">Insect</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-muted/40 transition-colors">
                <td className="px-3 py-2 text-left font-medium border-r border-border">{row.productor}</td>
                <td className="px-3 py-2 text-left border-r border-border text-muted-foreground">{row.finca}</td>
                <td className="px-3 py-2 text-left border-r border-border text-muted-foreground">{row.provincia}</td>
                <td className="px-3 py-2 text-right border-r border-border font-mono">{formatNumber(row.has, 1)}</td>
                <td className="px-3 py-2 text-right border-r-2 border-border/80 font-mono font-medium">{formatNumber(row.kilos)}</td>
                <td className="px-3 py-2 text-right border-r-2 border-border/80 font-mono font-semibold bg-primary/5">
                  {formatNumber(row.totalCostos)}
                </td>
                <td className="px-2.5 py-2 text-right border-r border-border font-mono font-medium">
                  {formatUSD(row.insumos.total)}
                </td>
                <td className="px-2.5 py-2 text-right border-r border-border font-mono text-muted-foreground">
                  {formatUSD(row.insumos.suelo)}
                </td>
                <td className="px-2.5 py-2 text-right border-r border-border font-mono text-muted-foreground">
                  {formatUSD(row.insumos.foliares)}
                </td>
                <td className="px-2.5 py-2 text-right border-r border-border font-mono text-muted-foreground">
                  {formatUSD(row.insumos.fung)}
                </td>
                <td className="px-2.5 py-2 text-right border-r border-border font-mono text-muted-foreground">
                  {formatUSD(row.insumos.herb)}
                </td>
                <td className="px-2.5 py-2 text-right border-r-2 border-border/80 font-mono text-muted-foreground">
                  {formatUSD(row.insumos.insect)}
                </td>
                <td className="px-2.5 py-2 text-right border-r-2 border-border/80 font-mono">
                  {formatUSD(row.combustible)}
                </td>
                <td className="px-2.5 py-2 text-right border-r-2 border-border/80 font-mono font-medium">
                  {formatUSD(row.mObra)}
                </td>
                <td className="px-2.5 py-2 text-right border-r-2 border-border/80 font-mono">
                  {formatUSD(row.energia)}
                </td>
                <td className="px-2.5 py-2 text-right border-r-2 border-border/80 font-mono">
                  {formatUSD(row.cosecha)}
                </td>
                <td className="px-2.5 py-2 text-right border-r-2 border-border/80 font-mono">
                  {formatUSD(row.adm)}
                </td>
                <td className="px-2.5 py-2 text-right font-mono">
                  {formatUSD(row.mant)}
                </td>
              </tr>
            ))}
          </tbody>

          {/* TOTAL FOOTER ROW */}
          <tfoot>
            <tr className="bg-muted/70 font-bold border-t-2 border-border text-foreground">
              <td className="px-3 py-2.5 text-left border-r border-border tracking-wider">TOTAL</td>
              <td className="px-3 py-2.5 border-r border-border"></td>
              <td className="px-3 py-2.5 border-r border-border"></td>
              <td className="px-3 py-2.5 text-right border-r border-border font-mono">{formatNumber(TOTAL_GENERAL.has, 1)}</td>
              <td className="px-3 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatNumber(TOTAL_GENERAL.kilos)}</td>
              <td className="px-3 py-2.5 text-right border-r-2 border-border/80 font-mono bg-primary/10">
                {formatUSD(TOTAL_GENERAL.totalCostos)}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">{formatUSD(TOTAL_GENERAL.insumos.total)}</td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">{formatUSD(TOTAL_GENERAL.insumos.suelo)}</td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">{formatUSD(TOTAL_GENERAL.insumos.foliares)}</td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">{formatUSD(TOTAL_GENERAL.insumos.fung)}</td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">$ 0</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatUSD(TOTAL_GENERAL.insumos.insect)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatUSD(TOTAL_GENERAL.combustible)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatUSD(TOTAL_GENERAL.mObra)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatUSD(TOTAL_GENERAL.energia)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatUSD(TOTAL_GENERAL.cosecha)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatUSD(TOTAL_GENERAL.adm)}</td>
              <td className="px-2.5 py-2.5 text-right font-mono">{formatUSD(TOTAL_GENERAL.mant)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: TABLA 2 - Por HA (Con Semáforo)
// ==========================================
function TablaPorHaComponent({ 
  data, 
  semaforoEnabled 
}: { 
  data: FormattedRowItem[]; 
  semaforoEnabled: boolean;
}) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-xs overflow-hidden">
      {/* Table header banner with Cyan Badge */}
      <div className="bg-muted/40 px-4 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-[#0096d2] text-white text-xs font-bold px-2.5 py-1 rounded-sm tracking-wide">
            Por HA
          </span>
          <span className="text-xs text-muted-foreground font-normal">
            Costos y rendimientos normalizados por hectárea
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">Unidad: USD/Ha (Kilos = kg/ha)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs select-text">
          <thead>
            {/* Header row 1 */}
            <tr className="bg-muted/30 text-foreground border-b border-border font-semibold">
              <th rowSpan={2} className="px-3 py-2 text-left border-r border-border min-w-[130px]">Productor</th>
              <th rowSpan={2} className="px-3 py-2 text-left border-r border-border min-w-[130px]">Finca</th>
              <th rowSpan={2} className="px-3 py-2 text-left border-r border-border min-w-[100px]">Provincia</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r border-border min-w-[65px]">Has</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 min-w-[75px]">Kilos</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 bg-primary/5 min-w-[100px] text-foreground font-bold">
                TOTAL COSTOS
              </th>
              <th colSpan={6} className="px-3 py-1.5 text-center border-r-2 border-border/80 bg-muted/40 font-bold border-b border-border">
                Insumos
              </th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 min-w-[85px]">Combustible</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 min-w-[90px]">M Obra</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 min-w-[80px]">Energia</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 min-w-[80px]">cosecha</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 min-w-[85px]">ADM</th>
              <th rowSpan={2} className="px-3 py-2 text-right min-w-[75px]">Mant</th>
            </tr>

            {/* Header row 2 */}
            <tr className="bg-muted/20 text-muted-foreground border-b-2 border-border font-medium text-[11px]">
              <th className="px-2 py-1.5 text-right border-r border-border font-semibold text-foreground">Total</th>
              <th className="px-2 py-1.5 text-right border-r border-border">suelo</th>
              <th className="px-2 py-1.5 text-right border-r border-border">foliares</th>
              <th className="px-2 py-1.5 text-right border-r border-border">fung</th>
              <th className="px-2 py-1.5 text-right border-r border-border">herb</th>
              <th className="px-2 py-1.5 text-right border-r-2 border-border/80">Insect</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {data.map((row) => (
              <tr key={row.id} className="hover:opacity-90 transition-opacity">
                <td className="px-3 py-2 text-left font-medium border-r border-border bg-card">{row.productor}</td>
                <td className="px-3 py-2 text-left border-r border-border text-muted-foreground bg-card">{row.finca}</td>
                <td className="px-3 py-2 text-left border-r border-border text-muted-foreground bg-card">{row.provincia}</td>
                <td className="px-3 py-2 text-right border-r border-border font-mono bg-card">{formatNumber(row.has, 1)}</td>

                {/* Kilos / Ha */}
                <td className={`px-3 py-2 text-right border-r-2 border-border/80 font-mono font-medium ${getCellBgClass(row.kilos.color, semaforoEnabled)}`}>
                  {typeof row.kilos.val === 'number' ? formatNumber(row.kilos.val) : row.kilos.val}
                </td>

                {/* Total Costos / Ha */}
                <td className={`px-3 py-2 text-right border-r-2 border-border/80 font-mono font-bold ${getCellBgClass(row.totalCostos.color, semaforoEnabled)}`}>
                  {typeof row.totalCostos.val === 'number' ? formatNumber(row.totalCostos.val) : row.totalCostos.val}
                </td>

                {/* Insumos */}
                <td className={`px-2.5 py-2 text-right border-r border-border font-mono ${getCellBgClass(row.insumosTotal.color, semaforoEnabled)}`}>
                  {typeof row.insumosTotal.val === 'number' ? formatNumber(row.insumosTotal.val) : row.insumosTotal.val}
                </td>
                <td className={`px-2.5 py-2 text-right border-r border-border font-mono ${getCellBgClass(row.insumosSuelo.color, semaforoEnabled)}`}>
                  {typeof row.insumosSuelo.val === 'number' ? formatNumber(row.insumosSuelo.val) : row.insumosSuelo.val}
                </td>
                <td className={`px-2.5 py-2 text-right border-r border-border font-mono ${getCellBgClass(row.insumosFoliares.color, semaforoEnabled)}`}>
                  {typeof row.insumosFoliares.val === 'number' ? formatNumber(row.insumosFoliares.val) : row.insumosFoliares.val}
                </td>
                <td className={`px-2.5 py-2 text-right border-r border-border font-mono ${getCellBgClass(row.insumosFung.color, semaforoEnabled)}`}>
                  {typeof row.insumosFung.val === 'number' ? formatNumber(row.insumosFung.val) : row.insumosFung.val}
                </td>
                <td className={`px-2.5 py-2 text-right border-r border-border font-mono ${getCellBgClass(row.insumosHerb.color, semaforoEnabled)}`}>
                  {typeof row.insumosHerb.val === 'number' ? formatNumber(row.insumosHerb.val) : row.insumosHerb.val}
                </td>
                <td className={`px-2.5 py-2 text-right border-r-2 border-border/80 font-mono ${getCellBgClass(row.insumosInsect.color, semaforoEnabled)}`}>
                  {typeof row.insumosInsect.val === 'number' ? formatNumber(row.insumosInsect.val) : row.insumosInsect.val}
                </td>

                {/* Combustible */}
                <td className={`px-2.5 py-2 text-right border-r-2 border-border/80 font-mono ${getCellBgClass(row.combustible.color, semaforoEnabled)}`}>
                  {typeof row.combustible.val === 'number' ? formatNumber(row.combustible.val) : row.combustible.val}
                </td>

                {/* M Obra */}
                <td className={`px-2.5 py-2 text-right border-r-2 border-border/80 font-mono ${getCellBgClass(row.mObra.color, semaforoEnabled)}`}>
                  {typeof row.mObra.val === 'number' ? formatNumber(row.mObra.val) : row.mObra.val}
                </td>

                {/* Energia */}
                <td className={`px-2.5 py-2 text-right border-r-2 border-border/80 font-mono ${getCellBgClass(row.energia.color, semaforoEnabled)}`}>
                  {typeof row.energia.val === 'number' ? formatNumber(row.energia.val) : row.energia.val}
                </td>

                {/* Cosecha */}
                <td className={`px-2.5 py-2 text-right border-r-2 border-border/80 font-mono ${getCellBgClass(row.cosecha.color, semaforoEnabled)}`}>
                  {typeof row.cosecha.val === 'number' ? formatNumber(row.cosecha.val) : row.cosecha.val}
                </td>

                {/* ADM */}
                <td className={`px-2.5 py-2 text-right border-r-2 border-border/80 font-mono ${getCellBgClass(row.adm.color, semaforoEnabled)}`}>
                  {typeof row.adm.val === 'number' ? formatNumber(row.adm.val) : row.adm.val}
                </td>

                {/* Mant */}
                <td className={`px-2.5 py-2 text-right font-mono ${getCellBgClass(row.mant.color, semaforoEnabled)}`}>
                  {typeof row.mant.val === 'number' ? formatNumber(row.mant.val) : row.mant.val}
                </td>
              </tr>
            ))}
          </tbody>

          {/* TOTAL FOOTER ROW */}
          <tfoot>
            <tr className="bg-muted/70 font-bold border-t-2 border-border text-foreground">
              <td className="px-3 py-2.5 text-left border-r border-border tracking-wider">TOTAL</td>
              <td className="px-3 py-2.5 border-r border-border"></td>
              <td className="px-3 py-2.5 border-r border-border"></td>
              <td className="px-3 py-2.5 text-right border-r border-border font-mono">{formatNumber(TOTAL_POR_HA.has, 1)}</td>
              <td className="px-3 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatNumber(TOTAL_POR_HA.kilos.val as number)}</td>
              <td className="px-3 py-2.5 text-right border-r-2 border-border/80 font-mono bg-primary/10">
                {formatNumber(TOTAL_POR_HA.totalCostos.val as number)}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">{formatNumber(TOTAL_POR_HA.insumosTotal.val as number)}</td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">{formatNumber(TOTAL_POR_HA.insumosSuelo.val as number)}</td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">{formatNumber(TOTAL_POR_HA.insumosFoliares.val as number)}</td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">{formatNumber(TOTAL_POR_HA.insumosFung.val as number)}</td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">-</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatNumber(TOTAL_POR_HA.insumosInsect.val as number)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatNumber(TOTAL_POR_HA.combustible.val as number)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatNumber(TOTAL_POR_HA.mObra.val as number)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatNumber(TOTAL_POR_HA.energia.val as number)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatNumber(TOTAL_POR_HA.cosecha.val as number)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatNumber(TOTAL_POR_HA.adm.val as number)}</td>
              <td className="px-2.5 py-2.5 text-right font-mono">{formatNumber(TOTAL_POR_HA.mant.val as number)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: TABLA 3 - Por KILO (Con Semáforo)
// ==========================================
function TablaPorKiloComponent({ 
  data, 
  semaforoEnabled 
}: { 
  data: FormattedRowItem[]; 
  semaforoEnabled: boolean;
}) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-xs overflow-hidden">
      {/* Table header banner with Cyan Badge */}
      <div className="bg-muted/40 px-4 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-[#0096d2] text-white text-xs font-bold px-2.5 py-1 rounded-sm tracking-wide">
            Por KILO
          </span>
          <span className="text-xs text-muted-foreground font-normal">
            Costos unitarios expresados en USD por kilo de nuez producido
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">Unidad: USD/Kg</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs select-text">
          <thead>
            {/* Header row 1 */}
            <tr className="bg-muted/30 text-foreground border-b border-border font-semibold">
              <th rowSpan={2} className="px-3 py-2 text-left border-r border-border min-w-[130px]">Productor</th>
              <th rowSpan={2} className="px-3 py-2 text-left border-r border-border min-w-[130px]">Finca</th>
              <th rowSpan={2} className="px-3 py-2 text-left border-r border-border min-w-[100px]">Provincia</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r border-border min-w-[65px]">Has</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 min-w-[75px]">Kilos</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 bg-primary/5 min-w-[100px] text-foreground font-bold">
                TOTAL COSTOS
              </th>
              <th colSpan={6} className="px-3 py-1.5 text-center border-r-2 border-border/80 bg-muted/40 font-bold border-b border-border">
                Insumos
              </th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 min-w-[85px]">Combustible</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 min-w-[90px]">M Obra</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 min-w-[80px]">Energia</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 min-w-[80px]">cosecha</th>
              <th rowSpan={2} className="px-3 py-2 text-right border-r-2 border-border/80 min-w-[85px]">ADM</th>
              <th rowSpan={2} className="px-3 py-2 text-right min-w-[75px]">Mant</th>
            </tr>

            {/* Header row 2 */}
            <tr className="bg-muted/20 text-muted-foreground border-b-2 border-border font-medium text-[11px]">
              <th className="px-2 py-1.5 text-right border-r border-border font-semibold text-foreground">Total</th>
              <th className="px-2 py-1.5 text-right border-r border-border">suelo</th>
              <th className="px-2 py-1.5 text-right border-r border-border">foliares</th>
              <th className="px-2 py-1.5 text-right border-r border-border">fung</th>
              <th className="px-2 py-1.5 text-right border-r border-border">herb</th>
              <th className="px-2 py-1.5 text-right border-r-2 border-border/80">Insect</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {data.map((row) => (
              <tr key={row.id} className="hover:opacity-90 transition-opacity">
                <td className="px-3 py-2 text-left font-medium border-r border-border bg-card">{row.productor}</td>
                <td className="px-3 py-2 text-left border-r border-border text-muted-foreground bg-card">{row.finca}</td>
                <td className="px-3 py-2 text-left border-r border-border text-muted-foreground bg-card">{row.provincia}</td>
                <td className="px-3 py-2 text-right border-r border-border font-mono bg-card">{formatNumber(row.has, 1)}</td>
                <td className="px-3 py-2 text-right border-r-2 border-border/80 font-mono bg-card">{formatNumber(row.kilos.val as number)}</td>

                {/* Total Costos / Kg */}
                <td className={`px-3 py-2 text-right border-r-2 border-border/80 font-mono font-bold ${getCellBgClass(row.totalCostos.color, semaforoEnabled)}`}>
                  {typeof row.totalCostos.val === 'number' ? formatNumber(row.totalCostos.val, 2) : row.totalCostos.val}
                </td>

                {/* Insumos */}
                <td className={`px-2.5 py-2 text-right border-r border-border font-mono ${getCellBgClass(row.insumosTotal.color, semaforoEnabled)}`}>
                  {typeof row.insumosTotal.val === 'number' ? formatNumber(row.insumosTotal.val, 2) : row.insumosTotal.val}
                </td>
                <td className={`px-2.5 py-2 text-right border-r border-border font-mono ${getCellBgClass(row.insumosSuelo.color, semaforoEnabled)}`}>
                  {typeof row.insumosSuelo.val === 'number' ? formatNumber(row.insumosSuelo.val, 2) : row.insumosSuelo.val}
                </td>
                <td className={`px-2.5 py-2 text-right border-r border-border font-mono ${getCellBgClass(row.insumosFoliares.color, semaforoEnabled)}`}>
                  {typeof row.insumosFoliares.val === 'number' ? formatNumber(row.insumosFoliares.val, 2) : row.insumosFoliares.val}
                </td>
                <td className={`px-2.5 py-2 text-right border-r border-border font-mono ${getCellBgClass(row.insumosFung.color, semaforoEnabled)}`}>
                  {typeof row.insumosFung.val === 'number' ? formatNumber(row.insumosFung.val, 2) : row.insumosFung.val}
                </td>
                <td className={`px-2.5 py-2 text-right border-r border-border font-mono ${getCellBgClass(row.insumosHerb.color, semaforoEnabled)}`}>
                  {typeof row.insumosHerb.val === 'number' ? formatNumber(row.insumosHerb.val, 2) : row.insumosHerb.val}
                </td>
                <td className={`px-2.5 py-2 text-right border-r-2 border-border/80 font-mono ${getCellBgClass(row.insumosInsect.color, semaforoEnabled)}`}>
                  {typeof row.insumosInsect.val === 'number' ? formatNumber(row.insumosInsect.val, 2) : row.insumosInsect.val}
                </td>

                {/* Combustible */}
                <td className={`px-2.5 py-2 text-right border-r-2 border-border/80 font-mono ${getCellBgClass(row.combustible.color, semaforoEnabled)}`}>
                  {typeof row.combustible.val === 'number' ? formatNumber(row.combustible.val, 2) : row.combustible.val}
                </td>

                {/* M Obra */}
                <td className={`px-2.5 py-2 text-right border-r-2 border-border/80 font-mono ${getCellBgClass(row.mObra.color, semaforoEnabled)}`}>
                  {typeof row.mObra.val === 'number' ? formatNumber(row.mObra.val, 2) : row.mObra.val}
                </td>

                {/* Energia */}
                <td className={`px-2.5 py-2 text-right border-r-2 border-border/80 font-mono ${getCellBgClass(row.energia.color, semaforoEnabled)}`}>
                  {typeof row.energia.val === 'number' ? formatNumber(row.energia.val, 2) : row.energia.val}
                </td>

                {/* Cosecha */}
                <td className={`px-2.5 py-2 text-right border-r-2 border-border/80 font-mono ${getCellBgClass(row.cosecha.color, semaforoEnabled)}`}>
                  {typeof row.cosecha.val === 'number' ? formatNumber(row.cosecha.val, 2) : row.cosecha.val}
                </td>

                {/* ADM */}
                <td className={`px-2.5 py-2 text-right border-r-2 border-border/80 font-mono ${getCellBgClass(row.adm.color, semaforoEnabled)}`}>
                  {typeof row.adm.val === 'number' ? formatNumber(row.adm.val, 2) : row.adm.val}
                </td>

                {/* Mant */}
                <td className={`px-2.5 py-2 text-right font-mono ${getCellBgClass(row.mant.color, semaforoEnabled)}`}>
                  {typeof row.mant.val === 'number' ? formatNumber(row.mant.val, 2) : row.mant.val}
                </td>
              </tr>
            ))}
          </tbody>

          {/* TOTAL FOOTER ROW */}
          <tfoot>
            <tr className="bg-muted/70 font-bold border-t-2 border-border text-foreground">
              <td className="px-3 py-2.5 text-left border-r border-border tracking-wider">TOTAL</td>
              <td className="px-3 py-2.5 border-r border-border"></td>
              <td className="px-3 py-2.5 border-r border-border"></td>
              <td className="px-3 py-2.5 text-right border-r border-border font-mono">{formatNumber(TOTAL_POR_KILO.has, 1)}</td>
              <td className="px-3 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatNumber(TOTAL_POR_KILO.kilos.val as number)}</td>
              <td className="px-3 py-2.5 text-right border-r-2 border-border/80 font-mono bg-primary/10">
                {formatNumber(TOTAL_POR_KILO.totalCostos.val as number, 2)}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">{formatNumber(TOTAL_POR_KILO.insumosTotal.val as number, 2)}</td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">{formatNumber(TOTAL_POR_KILO.insumosSuelo.val as number, 2)}</td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">{formatNumber(TOTAL_POR_KILO.insumosFoliares.val as number, 2)}</td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">{formatNumber(TOTAL_POR_KILO.insumosFung.val as number, 2)}</td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">-</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatNumber(TOTAL_POR_KILO.insumosInsect.val as number, 2)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatNumber(TOTAL_POR_KILO.combustible.val as number, 2)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatNumber(TOTAL_POR_KILO.mObra.val as number, 2)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatNumber(TOTAL_POR_KILO.energia.val as number, 2)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatNumber(TOTAL_POR_KILO.cosecha.val as number, 2)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatNumber(TOTAL_POR_KILO.adm.val as number, 2)}</td>
              <td className="px-2.5 py-2.5 text-right font-mono">{formatNumber(TOTAL_POR_KILO.mant.val as number, 2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: GRÁFICOS COMPARATIVOS
// ==========================================
interface ChartItem {
  name: string;
  finca: string;
  costoPorHa: number;
  costoPorKg: number;
  rendimientoKgHa: number;
  has: number;
  kilosTotales: number;
  totalCostos: number;
  insumos: number;
  mObra: number;
  combustible: number;
  energia: number;
  cosecha: number;
  adm: number;
  mant: number;
}

function GraficosComparativosComponent({ data }: { data: ChartItem[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico 1: Costo por Kilo vs Productor */}
      <Card className="border shadow-xs">
        <div className="p-4 border-b">
          <h3 className="text-base font-semibold text-foreground">Costo por Kilo (USD/Kg)</h3>
          <p className="text-xs text-muted-foreground">Comparativa de eficiencia de costo unitario por productor</p>
        </div>
        <CardContent className="p-4">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={11} angle={-15} textAnchor="end" />
                <YAxis fontSize={11} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  formatter={(val: number) => [`$ ${val.toFixed(2)} USD/Kg`, "Costo/Kg"]}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="costoPorKg" fill="#d97706" radius={[4, 4, 0, 0]} name="USD/Kg" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico 2: Costo por Hectárea vs Rendimiento */}
      <Card className="border shadow-xs">
        <div className="p-4 border-b">
          <h3 className="text-base font-semibold text-foreground">Rendimiento (Kg/Ha)</h3>
          <p className="text-xs text-muted-foreground">Volumen cosechado por hectárea productiva</p>
        </div>
        <CardContent className="p-4">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={11} angle={-15} textAnchor="end" />
                <YAxis fontSize={11} />
                <Tooltip 
                  formatter={(val: number) => [`${val.toLocaleString()} Kg/Ha`, "Rendimiento"]}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="rendimientoKgHa" fill="#059669" radius={[4, 4, 0, 0]} name="Kg/Ha" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico 3: Estructura de Costos por Productor (Mano de Obra vs Insumos vs Otros) */}
      <Card className="border shadow-xs lg:col-span-2">
        <div className="p-4 border-b">
          <h3 className="text-base font-semibold text-foreground">Composición de Costos Operativos por Productor (USD)</h3>
          <p className="text-xs text-muted-foreground">Desglose de los principales rubros de gasto por finca</p>
        </div>
        <CardContent className="p-4">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 15, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={11} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(val: number, name: string) => [`$ ${val.toLocaleString()} USD`, name]}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                <Bar dataKey="mObra" stackId="a" fill="#b45309" name="Mano de Obra" />
                <Bar dataKey="insumos" stackId="a" fill="#0284c7" name="Insumos" />
                <Bar dataKey="combustible" stackId="a" fill="#eab308" name="Combustible" />
                <Bar dataKey="cosecha" stackId="a" fill="#10b981" name="Cosecha" />
                <Bar dataKey="energia" stackId="a" fill="#6366f1" name="Energía" />
                <Bar dataKey="adm" stackId="a" fill="#ec4899" name="ADM" />
                <Bar dataKey="mant" stackId="a" fill="#64748b" name="Mantenimiento" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
