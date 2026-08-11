import { useEffect, useState, useMemo } from "react";
import { getBenchmarkingProjects } from "@/services/projectService";
import type { BenchmarkingProject } from "@/services/projectService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, BarChart3, Building2, User, MapPin, DollarSign, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SortField = 'user_name' | 'project_name' | 'pais' | 'provincia' | 'localidad' | 'total_costos_op' | 'costo_por_ha' | 'costo_por_kg';
type SortDirection = 'asc' | 'desc';

const PanelEstadistico = () => {
  const [projects, setProjects] = useState<BenchmarkingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"resumen">("resumen");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBenchmarkingProjects();
      setProjects(data || []);
    } catch (err: any) {
      console.error("Error cargando datos de benchmarking:", err);
      setError(err?.message || "Ocurrió un error al cargar la información del panel estadístico.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const processedProjects = useMemo(() => {
    let result = [...projects];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.user_name.toLowerCase().includes(term) ||
          p.project_name.toLowerCase().includes(term) ||
          (p.pais && p.pais.toLowerCase().includes(term)) ||
          (p.provincia && p.provincia.toLowerCase().includes(term)) ||
          (p.localidad && p.localidad.toLowerCase().includes(term))
      );
    }

    if (sortField) {
      result.sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortField === 'user_name') {
          valA = a.user_name || '';
          valB = b.user_name || '';
        } else if (sortField === 'project_name') {
          valA = a.project_name || '';
          valB = b.project_name || '';
        } else if (sortField === 'pais') {
          valA = a.pais || '';
          valB = b.pais || '';
        } else if (sortField === 'provincia') {
          valA = a.provincia || '';
          valB = b.provincia || '';
        } else if (sortField === 'localidad') {
          valA = a.localidad || a.municipio || a.departamento || '';
          valB = b.localidad || b.municipio || b.departamento || '';
        } else if (sortField === 'total_costos_op') {
          valA = a.total_costos_op || 0;
          valB = b.total_costos_op || 0;
        } else if (sortField === 'costo_por_ha') {
          valA = a.costo_por_ha || 0;
          valB = b.costo_por_ha || 0;
        } else if (sortField === 'costo_por_kg') {
          valA = a.costo_por_kg || 0;
          valB = b.costo_por_kg || 0;
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          const comp = valA.localeCompare(valB, 'es', { sensitivity: 'base' });
          return sortDirection === 'asc' ? comp : -comp;
        } else {
          const numA = Number(valA);
          const numB = Number(valB);
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }
      });
    }

    return result;
  }, [projects, searchTerm, sortField, sortDirection]);

  const currentYear = new Date().getFullYear();

  const renderSortHeader = (field: SortField, label: string, icon?: React.ReactNode, alignRight = false) => {
    const isSorted = sortField === field;
    return (
      <th
        className={`p-3 font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors group ${
          alignRight ? "text-right" : "text-left"
        }`}
        onClick={() => handleSort(field)}
      >
        <div className={`flex items-center gap-1.5 ${alignRight ? "justify-end" : "justify-start"}`}>
          {icon}
          <span>{label}</span>
          {isSorted ? (
            sortDirection === "asc" ? (
              <ArrowUp className="h-4 w-4 text-primary font-bold" />
            ) : (
              <ArrowDown className="h-4 w-4 text-primary font-bold" />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50 opacity-60 group-hover:opacity-100" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Panel estadístico</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Análisis comparativo de proyectos con benchmarking activo
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar datos
        </Button>
      </div>

      {/* Sub-header / Tabs Navigation */}
      <div className="border-b border-border flex gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("resumen")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "resumen"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Resumen ejecutivo
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-8 text-center text-destructive">
            <p className="font-semibold mb-2">Error de acceso o carga</p>
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 shadow-md">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Resumen ejecutivo de proyectos
                <Badge variant="secondary" className="ml-2">
                  {processedProjects.length} {processedProjects.length === 1 ? "proyecto" : "proyectos"}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                Proyectos con benchmarking permitido. KPIs calculadas para la campaña del año vigente ({currentYear}).
              </CardDescription>
            </div>

            {/* Filter / Search input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por usuario, proyecto, ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          </CardHeader>

          <CardContent>
            {processedProjects.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground mb-1">
                  {searchTerm ? "No se encontraron resultados" : "No hay proyectos con benchmarking activado"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {searchTerm
                    ? "Intenta buscando con otro término de filtro."
                    : "Actualmente ningún proyecto registrado posee habilitada la opción de benchmarking."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {renderSortHeader('user_name', 'Usuario', <User className="h-4 w-4" />)}
                      {renderSortHeader('project_name', 'Título', <Building2 className="h-4 w-4" />)}
                      {renderSortHeader('pais', 'País', <MapPin className="h-4 w-4" />)}
                      {renderSortHeader('provincia', 'Provincia')}
                      {renderSortHeader('localidad', 'Localidad')}
                      {renderSortHeader('total_costos_op', 'Costos Op. Total', <DollarSign className="h-4 w-4" />, true)}
                      {renderSortHeader('costo_por_ha', 'Costo / ha', undefined, true)}
                      {renderSortHeader('costo_por_kg', 'Costo / kg', undefined, true)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {processedProjects.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-accent/10 transition-colors"
                      >
                        <td className="p-3 font-medium text-foreground">
                          {item.user_name}
                        </td>
                        <td className="p-3 font-semibold text-primary">
                          {item.project_name}
                        </td>
                        <td className="p-3 text-muted-foreground">{item.pais || "-"}</td>
                        <td className="p-3 text-muted-foreground">{item.provincia || "-"}</td>
                        <td className="p-3 text-muted-foreground">
                          {item.localidad || item.municipio || item.departamento || "-"}
                        </td>
                        <td className="p-3 text-right font-medium text-foreground">
                          {formatCurrency(item.total_costos_op)}
                        </td>
                        <td className="p-3 text-right font-medium text-foreground">
                          {item.total_ha > 0 ? formatCurrency(item.costo_por_ha) : "-"}
                        </td>
                        <td className="p-3 text-right font-medium text-foreground">
                          {item.total_production_kg > 0 ? formatCurrency(item.costo_por_kg) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PanelEstadistico;
