import { useState, useMemo, useEffect, useCallback } from "react";
import { 
  calculateTotals,
  calculateTablaPorHa,
  calculateTablaPorKilo,
  AGE_BRACKETS_CONFIG,
} from "@/data/indicadoresData";
import type { FormattedRowItem, ProductorData, AgeBracketId } from "@/data/indicadoresData";
import { getAdminIndicadores } from "@/services/indicadoresService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Search, 
  Download, 
  Printer,  
  TrendingUp,   
  Trees, 
  Palette,
  BarChart3,
  Table as TableIcon,
  SlidersHorizontal,
  Lock,
  ShieldCheck,
  Loader2,
  RefreshCw,
  AlertCircle,
  Database,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";
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
  const { isAdmin } = useApp();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedProvincia, setSelectedProvincia] = useState<string>("TODAS");
  const [semaforoEnabled, setSemaforoEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState("todas");

  // Filtro de Edad de los Montes: solo 1 a 5 años, 9 a 11 años y personalizado
  const [selectedAgeBracket, setSelectedAgeBracket] = useState<AgeBracketId>("9-11");
  const [customMinAge, setCustomMinAge] = useState<number>(1);
  const [customMaxAge, setCustomMaxAge] = useState<number>(15);

  // Estados de datos reales de la BD
  const [dbProducers, setDbProducers] = useState<ProductorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rango etario efectivo actual
  const effectiveAgeRange = useMemo(() => {
    if (selectedAgeBracket === "young") {
      return { min: 1, max: 5, label: "1 a 5 años (Formación)" };
    }
    if (selectedAgeBracket === "9-11") {
      return { min: 9, max: 11, label: "9 a 11 años (Evaluación CAPPecan)" };
    }
    const cleanMin = Math.max(1, customMinAge);
    const cleanMax = Math.max(cleanMin, customMaxAge);
    return { min: cleanMin, max: cleanMax, label: `Personalizado (${cleanMin} a ${cleanMax} años)` };
  }, [selectedAgeBracket, customMinAge, customMaxAge]);

  // Cargar datos reales de la BD desde el endpoint REST exclusivo de admin
  const loadRealData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminIndicadores(effectiveAgeRange.min, effectiveAgeRange.max);
      setDbProducers(data);
    } catch (err: any) {
      console.error("Error al cargar indicadores reales:", err);
      setError("No se pudieron cargar los datos de los productores desde la base de datos.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, effectiveAgeRange.min, effectiveAgeRange.max]);

  useEffect(() => {
    loadRealData();
  }, [loadRealData]);

  // Totales de referencia del grupo para esta edad (para cálculo de medias y semáforos)
  const cohortTotals = useMemo(() => {
    return calculateTotals(dbProducers);
  }, [dbProducers]);

  // Filas formateadas por Ha y por Kilo calculadas dinámicamente sobre datos reales de la BD
  const dynamicHaRows = useMemo(() => {
    return calculateTablaPorHa(dbProducers, cohortTotals.totalGeneral);
  }, [dbProducers, cohortTotals]);

  const dynamicKiloRows = useMemo(() => {
    return calculateTablaPorKilo(dbProducers, cohortTotals.totalGeneral);
  }, [dbProducers, cohortTotals]);

  // Filtro por búsqueda de productor/finca y provincia
  const filteredTotales = useMemo(() => {
    return dbProducers.filter(p => {
      const matchSearch = p.productor.toLowerCase().includes(search.toLowerCase()) ||
                          p.finca.toLowerCase().includes(search.toLowerCase());
      const matchProv = selectedProvincia === "TODAS" || p.provincia.toLowerCase() === selectedProvincia.toLowerCase();
      return matchSearch && matchProv;
    });
  }, [dbProducers, search, selectedProvincia]);

  const filteredHa = useMemo(() => {
    return dynamicHaRows.filter(p => {
      const matchSearch = p.productor.toLowerCase().includes(search.toLowerCase()) ||
                          p.finca.toLowerCase().includes(search.toLowerCase());
      const matchProv = selectedProvincia === "TODAS" || p.provincia.toLowerCase() === selectedProvincia.toLowerCase();
      return matchSearch && matchProv;
    });
  }, [dynamicHaRows, search, selectedProvincia]);

  const filteredKilo = useMemo(() => {
    return dynamicKiloRows.filter(p => {
      const matchSearch = p.productor.toLowerCase().includes(search.toLowerCase()) ||
                          p.finca.toLowerCase().includes(search.toLowerCase());
      const matchProv = selectedProvincia === "TODAS" || p.provincia.toLowerCase() === selectedProvincia.toLowerCase();
      return matchSearch && matchProv;
    });
  }, [dynamicKiloRows, search, selectedProvincia]);

  // Totales mostrados en el pie de tabla y en los KPI cards (recalculados según filtro de provincia/búsqueda)
  const displayTotals = useMemo(() => {
    return calculateTotals(filteredTotales);
  }, [filteredTotales]);

  // Configuración del estrato etario activo
  const currentBracketConfig = useMemo(() => {
    return AGE_BRACKETS_CONFIG.find(b => b.id === selectedAgeBracket) || AGE_BRACKETS_CONFIG[0];
  }, [selectedAgeBracket]);

  const ageStageLabel = useMemo(() => {
    if (selectedAgeBracket === "custom") {
      return `Rango ${customMinAge} a ${customMaxAge} años`;
    }
    return currentBracketConfig.rangeLabel;
  }, [selectedAgeBracket, customMinAge, customMaxAge, currentBracketConfig]);

  // Lista de provincias dinámicas presentes en la base de datos
  const availableProvinces = useMemo(() => {
    const set = new Set<string>();
    dbProducers.forEach(p => {
      if (p.provincia && p.provincia !== 'Sin provincia') {
        set.add(p.provincia);
      }
    });
    return ["TODAS", ...Array.from(set)];
  }, [dbProducers]);

  // Chart data dinámico
  const chartComparisonData = useMemo(() => {
    return filteredTotales.map(p => {
      const haRow = dynamicHaRows.find(h => h.id === p.id);
      const kgRow = dynamicKiloRows.find(k => k.id === p.id);
      return {
        name: p.productor,
        finca: p.finca,
        costoPorHa: Number(haRow?.totalCostos.val || 0),
        costoPorKg: typeof kgRow?.totalCostos.val === 'number' ? kgRow.totalCostos.val : 0,
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
  }, [filteredTotales, dynamicHaRows, dynamicKiloRows]);

  const handleExportCSV = () => {
    const headers = [
      "Tabla", "Edad Evaluada", "Productor", "Finca", "Provincia", "Has", "Kilos", "TOTAL COSTOS",
      "Insumos Total", "Suelo", "Foliares", "Fung", "Herb", "Insect",
      "Combustible", "M Obra", "Energia", "Cosecha", "ADM", "Mant"
    ];

    const rows: string[][] = [];

    // Tabla 1: Totales
    filteredTotales.forEach(p => {
      rows.push([
        "TOTALES", ageStageLabel, p.productor, p.finca, p.provincia, String(p.has), String(p.kilos), String(p.totalCostos),
        String(p.insumos.total), String(p.insumos.suelo || ""), String(p.insumos.foliares || ""),
        String(p.insumos.fung || ""), String(p.insumos.herb || ""), String(p.insumos.insect || ""),
        String(p.combustible), String(p.mObra), String(p.energia), String(p.cosecha),
        String(p.adm || ""), String(p.mant || "")
      ]);
    });

    // Tabla 2: Por Ha
    filteredHa.forEach(p => {
      rows.push([
        "POR HA", ageStageLabel, p.productor, p.finca, p.provincia, String(p.has), String(p.kilos.val), String(p.totalCostos.val),
        String(p.insumosTotal.val), String(p.insumosSuelo.val), String(p.insumosFoliares.val),
        String(p.insumosFung.val), String(p.insumosHerb.val), String(p.insumosInsect.val),
        String(p.combustible.val), String(p.mObra.val), String(p.energia.val), String(p.cosecha.val),
        String(p.adm.val), String(p.mant.val)
      ]);
    });

    // Tabla 3: Por Kilo
    filteredKilo.forEach(p => {
      rows.push([
        "POR KILO", ageStageLabel, p.productor, p.finca, p.provincia, String(p.has), String(p.kilos.val), String(p.totalCostos.val),
        String(p.insumosTotal.val), String(p.insumosSuelo.val), String(p.insumosFoliares.val),
        String(p.insumosFung.val), String(p.insumosHerb.val), String(p.insumosInsect.val),
        String(p.combustible.val), String(p.mObra.val), String(p.energia.val), String(p.cosecha.val),
        String(p.adm.val), String(p.mant.val)
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `indicadores_reales_pecan_${selectedAgeBracket}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // 1. Control de Privacidad: Acceso Exclusivo Administrador
  if (!isAdmin) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto my-12">
        <Card className="border border-border/80 shadow-sm p-6 sm:p-10 text-center bg-card">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Lock className="w-7 h-7" />
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 font-semibold mb-3">
            Acceso Exclusivo para Administradores
          </Badge>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            Panel de Indicadores por Productor
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-4 leading-relaxed">
            La tabla detallada de indicadores desglosa las métricas reales e individuales de costos, rendimientos e insumos de cada finca registrada en la base de datos. El acceso a los datos individuales de todos los productores está reservado exclusivamente para administradores.
          </p>
          <p className="text-xs text-muted-foreground/80 max-w-md mx-auto mb-6">
            Para analizar tus propios costos y compararte con la media de referencia de otros productores por edad de monte, ingresa a la pestaña <strong>Comparaciones</strong> en Costos Operativos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button onClick={() => navigate("/costos")} variant="default" className="gap-2 cursor-pointer">
              <TrendingUp className="w-4 h-4" />
              <span>Ir a Costos y Comparaciones</span>
            </Button>
            <Button onClick={() => navigate("/dashboard")} variant="outline" className="cursor-pointer">
              Volver al Inicio
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full overflow-hidden print:p-0">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground m-0">
              Indicadores
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold px-2.5 py-0.5 gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Acceso Administrador</span>
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold px-2.5 py-0.5 gap-1.5 hidden sm:inline-flex">
              <Database className="w-3.5 h-3.5" />
              <span>Datos Reales BD</span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Consolidado histórico de productores extraído en tiempo real desde la base de datos de usuarios.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={loadRealData}
            disabled={loading}
            className="gap-1.5 text-xs h-9 cursor-pointer"
            title="Recargar datos de la base de datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={dbProducers.length === 0}
            className="gap-1.5 text-xs h-9 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs h-9 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </Button>
        </div>
      </div>

      {/* FILTRO POR EDAD DE LOS MONTES: SOLO 1-5, 9-11 Y PERSONALIZADO */}
      <div className="bg-card rounded-xl border border-border/70 p-4 sm:p-5 shadow-xs space-y-3.5 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Trees className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-foreground m-0">
                Filtro por Edad de los Montes
              </h3>
              <Badge variant="outline" className="text-[11px] bg-primary/5 text-primary border-primary/20 font-medium">
                Cohorte Histórica
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              El sistema rastrea el historial multianual de todos los montes de la base de datos y agrega las campañas donde alcanzaron estas edades.
            </p>
          </div>

          {selectedAgeBracket !== "9-11" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedAgeBracket("9-11")}
              className="text-xs font-semibold text-primary hover:text-primary/80 self-start sm:self-auto h-8 px-2 cursor-pointer"
            >
              Restablecer a 9 a 11 años
            </Button>
          )}
        </div>

        {/* Presets de Edad Solicitados */}
        <div className="flex flex-wrap items-center gap-2">
          {AGE_BRACKETS_CONFIG.map((preset) => {
            const isActive = selectedAgeBracket === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedAgeBracket(preset.id)}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all border flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background text-foreground border-border hover:bg-muted/70"
                }`}
                title={preset.description}
              >
                <span className="font-semibold">{preset.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-sm font-normal ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {preset.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selector de Rango Personalizado si se selecciona "custom" */}
        {selectedAgeBracket === "custom" && (
          <div className="pt-2 pb-1 border-t border-border/50 flex flex-wrap items-center gap-4 animate-in fade-in-50 duration-150">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Rango de edad personalizado:</span>
            </div>
            <div className="flex items-center gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">
                  Edad Mínima (años)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={40}
                  value={customMinAge}
                  onChange={(e) => setCustomMinAge(Math.max(1, Number(e.target.value)))}
                  className="w-24 h-8 text-xs font-semibold bg-background"
                />
              </div>
              <span className="text-muted-foreground text-sm self-end pb-1.5 font-bold">—</span>
              <div>
                <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">
                  Edad Máxima (años)
                </label>
                <Input
                  type="number"
                  min={customMinAge}
                  max={40}
                  value={customMaxAge}
                  onChange={(e) => setCustomMaxAge(Math.max(customMinAge, Number(e.target.value)))}
                  className="w-24 h-8 text-xs font-semibold bg-background"
                />
              </div>
            </div>
          </div>
        )}

        {/* Nota informativa de la etapa seleccionada */}
        <div className="text-[11px] text-muted-foreground pt-1 flex items-center gap-1.5">
          <span className="font-medium text-foreground">Etapa activa:</span>
          <span>{ageStageLabel}</span>
          <span>—</span>
          <span>{currentBracketConfig.description}</span>
        </div>
      </div>

      {/* Estado de Error */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadRealData} className="h-8 text-xs">
            Reintentar
          </Button>
        </div>
      )}

      {/* Estado de Carga */}
      {loading ? (
        <div className="bg-card border rounded-lg p-12 text-center shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">Procesando datos de la base de datos...</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Consultando registros históricos de montes y campañas para el rango {ageStageLabel}.
          </p>
        </div>
      ) : dbProducers.length === 0 ? (
        /* Estado Vacío */
        <div className="bg-card border rounded-lg p-10 text-center shadow-xs">
          <Database className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">Sin registros para este rango de edad</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">
            No se encontraron campañas históricas cargadas de productores cuyos montes hayan atravesado la etapa de <strong>{ageStageLabel}</strong>.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedAgeBracket("9-11")}>
              Ver 9 a 11 años
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedAgeBracket("young")}>
              Ver 1 a 5 años
            </Button>
          </div>
        </div>
      ) : (
        <>
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
                  {availableProvinces.map((prov) => (
                    <button
                      key={prov}
                      onClick={() => setSelectedProvincia(prov)}
                      className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2 print:hidden">
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

              {/* Semáforo Switch + Indicadores de Colores */}
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <div className="flex items-center gap-2 bg-muted/40 px-2.5 py-1 rounded-md border border-border/50">
                  <Switch
                    id="semaforo-switch"
                    checked={semaforoEnabled}
                    onCheckedChange={setSemaforoEnabled}
                    className="cursor-pointer scale-90 data-[state=checked]:bg-emerald-600"
                  />
                  <label
                    htmlFor="semaforo-switch"
                    className="text-xs font-semibold cursor-pointer select-none flex items-center gap-1.5 text-foreground"
                    title="Activar/Desactivar coloreado de semáforo"
                  >
                    <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Semáforo</span>
                  </label>
                </div>

                <div 
                  className={`hidden sm:flex items-center gap-2.5 text-xs transition-opacity duration-150 ${
                    semaforoEnabled ? "opacity-100" : "opacity-35 grayscale"
                  }`}
                >
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#c6efce] border border-[#006100]/30 inline-block"></span>
                    <span>Favorable</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#ffeb9c] border border-[#9c6500]/30 inline-block"></span>
                    <span>Intermedio</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#ffc7ce] border border-[#9c0006]/30 inline-block"></span>
                    <span>Elevado</span>
                  </span>
                </div>
              </div>
            </div>

            {/* TAB 1: ALL TABLES */}
            <TabsContent value="todas" className="mt-4 space-y-8">
              <TablaTotalesComponent 
                data={filteredTotales} 
                totals={displayTotals.totalGeneral} 
                ageLabel={ageStageLabel}
              />
              <TablaPorHaComponent 
                data={filteredHa} 
                totals={displayTotals.totalPorHa} 
                semaforoEnabled={semaforoEnabled} 
                ageLabel={ageStageLabel}
              />
              <TablaPorKiloComponent 
                data={filteredKilo} 
                totals={displayTotals.totalPorKilo} 
                semaforoEnabled={semaforoEnabled} 
                ageLabel={ageStageLabel}
              />
            </TabsContent>

            {/* TAB 2: ONLY TOTALS */}
            <TabsContent value="totales" className="mt-4">
              <TablaTotalesComponent 
                data={filteredTotales} 
                totals={displayTotals.totalGeneral} 
                ageLabel={ageStageLabel}
              />
            </TabsContent>

            {/* TAB 3: ONLY POR HA */}
            <TabsContent value="ha" className="mt-4">
              <TablaPorHaComponent 
                data={filteredHa} 
                totals={displayTotals.totalPorHa} 
                semaforoEnabled={semaforoEnabled} 
                ageLabel={ageStageLabel}
              />
            </TabsContent>

            {/* TAB 4: ONLY POR KILO */}
            <TabsContent value="kilo" className="mt-4">
              <TablaPorKiloComponent 
                data={filteredKilo} 
                totals={displayTotals.totalPorKilo} 
                semaforoEnabled={semaforoEnabled} 
                ageLabel={ageStageLabel}
              />
            </TabsContent>

            {/* TAB 5: CHARTS */}
            <TabsContent value="graficos" className="mt-4 space-y-6">
              <GraficosComparativosComponent data={chartComparisonData} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE: TABLA 1 - INDICADORES (Totales)
// ==========================================
function TablaTotalesComponent({ 
  data, 
  totals, 
  ageLabel 
}: { 
  data: ProductorData[]; 
  totals: ProductorData; 
  ageLabel: string;
}) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-xs overflow-hidden">
      {/* Table header banner */}
      <div className="bg-muted/40 px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold tracking-wide uppercase text-foreground m-0">
            INDICADORES
          </h2>
          <span className="text-xs text-muted-foreground font-normal">
            (Valores Absolutos Totales en USD — {ageLabel})
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">{data.length} Productores analizados</span>
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
                <td className="px-2.5 py-2.5 text-right border-r border-border font-mono text-muted-foreground">
                  {formatUSD(row.insumos.suelo)}
                </td>
                <td className="px-2.5 py-2.5 text-right border-r border-border font-mono text-muted-foreground">
                  {formatUSD(row.insumos.foliares)}
                </td>
                <td className="px-2.5 py-2.5 text-right border-r border-border font-mono text-muted-foreground">
                  {formatUSD(row.insumos.fung)}
                </td>
                <td className="px-2.5 py-2.5 text-right border-r border-border font-mono text-muted-foreground">
                  {formatUSD(row.insumos.herb)}
                </td>
                <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono text-muted-foreground">
                  {formatUSD(row.insumos.insect)}
                </td>
                <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">
                  {formatUSD(row.combustible)}
                </td>
                <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono font-medium">
                  {formatUSD(row.mObra)}
                </td>
                <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">
                  {formatUSD(row.energia)}
                </td>
                <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">
                  {formatUSD(row.cosecha)}
                </td>
                <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">
                  {formatUSD(row.adm)}
                </td>
                <td className="px-2.5 py-2.5 text-right font-mono">
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
              <td className="px-3 py-2.5 text-right border-r border-border font-mono">{formatNumber(totals.has, 1)}</td>
              <td className="px-3 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatNumber(totals.kilos)}</td>
              <td className="px-3 py-2.5 text-right border-r-2 border-border/80 font-mono bg-primary/10">
                {formatUSD(totals.totalCostos)}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">{formatUSD(totals.insumos.total)}</td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">{formatUSD(totals.insumos.suelo)}</td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">{formatUSD(totals.insumos.foliares)}</td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">{formatUSD(totals.insumos.fung)}</td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">
                {totals.insumos.herb ? formatUSD(totals.insumos.herb) : "$ 0"}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatUSD(totals.insumos.insect)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatUSD(totals.combustible)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatUSD(totals.mObra)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatUSD(totals.energia)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatUSD(totals.cosecha)}</td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatUSD(totals.adm)}</td>
              <td className="px-2.5 py-2.5 text-right font-mono">{formatUSD(totals.mant)}</td>
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
  totals,
  semaforoEnabled,
  ageLabel
}: { 
  data: FormattedRowItem[]; 
  totals: FormattedRowItem;
  semaforoEnabled: boolean;
  ageLabel: string;
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
            Costos y rendimientos normalizados por hectárea — {ageLabel}
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
              <td className="px-3 py-2.5 text-right border-r border-border font-mono">{formatNumber(totals.has, 1)}</td>
              <td className="px-3 py-2.5 text-right border-r-2 border-border/80 font-mono">
                {typeof totals.kilos.val === 'number' ? formatNumber(totals.kilos.val) : totals.kilos.val}
              </td>
              <td className="px-3 py-2.5 text-right border-r-2 border-border/80 font-mono bg-primary/10">
                {typeof totals.totalCostos.val === 'number' ? formatNumber(totals.totalCostos.val) : totals.totalCostos.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">
                {typeof totals.insumosTotal.val === 'number' ? formatNumber(totals.insumosTotal.val) : totals.insumosTotal.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">
                {typeof totals.insumosSuelo.val === 'number' ? formatNumber(totals.insumosSuelo.val) : totals.insumosSuelo.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">
                {typeof totals.insumosFoliares.val === 'number' ? formatNumber(totals.insumosFoliares.val) : totals.insumosFoliares.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">
                {typeof totals.insumosFung.val === 'number' ? formatNumber(totals.insumosFung.val) : totals.insumosFung.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">
                {typeof totals.insumosHerb.val === 'number' ? formatNumber(totals.insumosHerb.val) : totals.insumosHerb.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">
                {typeof totals.insumosInsect.val === 'number' ? formatNumber(totals.insumosInsect.val) : totals.insumosInsect.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">
                {typeof totals.combustible.val === 'number' ? formatNumber(totals.combustible.val) : totals.combustible.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">
                {typeof totals.mObra.val === 'number' ? formatNumber(totals.mObra.val) : totals.mObra.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">
                {typeof totals.energia.val === 'number' ? formatNumber(totals.energia.val) : totals.energia.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">
                {typeof totals.cosecha.val === 'number' ? formatNumber(totals.cosecha.val) : totals.cosecha.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">
                {typeof totals.adm.val === 'number' ? formatNumber(totals.adm.val) : totals.adm.val}
              </td>
              <td className="px-2.5 py-2.5 text-right font-mono">
                {typeof totals.mant.val === 'number' ? formatNumber(totals.mant.val) : totals.mant.val}
              </td>
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
  totals,
  semaforoEnabled,
  ageLabel
}: { 
  data: FormattedRowItem[]; 
  totals: FormattedRowItem;
  semaforoEnabled: boolean;
  ageLabel: string;
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
            Costos unitarios expresados en USD por kilo de nuez producido — {ageLabel}
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
              <td className="px-3 py-2.5 text-right border-r border-border font-mono">{formatNumber(totals.has, 1)}</td>
              <td className="px-3 py-2.5 text-right border-r-2 border-border/80 font-mono">{formatNumber(totals.kilos.val as number)}</td>
              <td className="px-3 py-2.5 text-right border-r-2 border-border/80 font-mono bg-primary/10">
                {typeof totals.totalCostos.val === 'number' ? formatNumber(totals.totalCostos.val, 2) : totals.totalCostos.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">
                {typeof totals.insumosTotal.val === 'number' ? formatNumber(totals.insumosTotal.val, 2) : totals.insumosTotal.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">
                {typeof totals.insumosSuelo.val === 'number' ? formatNumber(totals.insumosSuelo.val, 2) : totals.insumosSuelo.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">
                {typeof totals.insumosFoliares.val === 'number' ? formatNumber(totals.insumosFoliares.val, 2) : totals.insumosFoliares.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">
                {typeof totals.insumosFung.val === 'number' ? formatNumber(totals.insumosFung.val, 2) : totals.insumosFung.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r border-border font-mono">
                {typeof totals.insumosHerb.val === 'number' ? formatNumber(totals.insumosHerb.val, 2) : totals.insumosHerb.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">
                {typeof totals.insumosInsect.val === 'number' ? formatNumber(totals.insumosInsect.val, 2) : totals.insumosInsect.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">
                {typeof totals.combustible.val === 'number' ? formatNumber(totals.combustible.val, 2) : totals.combustible.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">
                {typeof totals.mObra.val === 'number' ? formatNumber(totals.mObra.val, 2) : totals.mObra.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">
                {typeof totals.energia.val === 'number' ? formatNumber(totals.energia.val, 2) : totals.energia.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">
                {typeof totals.cosecha.val === 'number' ? formatNumber(totals.cosecha.val, 2) : totals.cosecha.val}
              </td>
              <td className="px-2.5 py-2.5 text-right border-r-2 border-border/80 font-mono">
                {typeof totals.adm.val === 'number' ? formatNumber(totals.adm.val, 2) : totals.adm.val}
              </td>
              <td className="px-2.5 py-2.5 text-right font-mono">
                {typeof totals.mant.val === 'number' ? formatNumber(totals.mant.val, 2) : totals.mant.val}
              </td>
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
