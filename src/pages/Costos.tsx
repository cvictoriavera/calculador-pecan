import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Scale,
  Pencil,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Fuel,
  Users,
  Zap,
  Wheat,
  FileText,
  Wrench,
  FlaskConical,
  MoreHorizontal,
  Sprout,
  Leaf,
  Pill,
  Bug,
} from "lucide-react";
import AddCostoSheet from "@/components/costos/AddCostoSheet";
import { useDataStore } from "@/stores";
import { useApp } from "@/contexts/AppContext";
import { useCalculationsStore } from "@/stores/calculationsStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Definición y estilos de cada rubro/categoría
export interface CategoryConfig {
  id: string;
  label: string;
  color: string;
  icon: any;
}

const CATEGORIES_CONFIG: Record<string, CategoryConfig> = {
  "mano-obra": {
    id: "mano-obra",
    label: "Mano de Obra",
    color: "#ba995c",
    icon: Users,
  },
  cosecha: {
    id: "cosecha",
    label: "Cosecha",
    color: "#f2794a",
    icon: Wheat,
  },
  energia: {
    id: "energia",
    label: "Energía",
    color: "#f2c02b",
    icon: Zap,
  },
  mantenimientos: {
    id: "mantenimientos",
    label: "Mantenimientos",
    color: "#cb2030",
    icon: Wrench,
  },
  combustible: {
    id: "combustible",
    label: "Combustible",
    color: "#22469c",
    icon: Fuel,
  },
  insumos: {
    id: "insumos",
    label: "Insumos",
    color: "#16af92",
    icon: FlaskConical,
  },
  "gastos-admin": {
    id: "gastos-admin",
    label: "Administración",
    color: "#762c4d",
    icon: FileText,
  },
  "costos-oportunidad": {
    id: "costos-oportunidad",
    label: "Oportunidad",
    color: "#bc5930",
    icon: TrendingUp,
  },
  otros: {
    id: "otros",
    label: "Otros",
    color: "#64748b",
    icon: MoreHorizontal,
  },
};

export interface InsumoTypeConfig {
  id: string;
  label: string;
  color: string;
  icon: any;
}

const INSUMOS_CONFIG: Record<string, InsumoTypeConfig> = {
  "fertilizantes-suelo": {
    id: "fertilizantes-suelo",
    label: "Fertilizantes al suelo",
    color: "#16a34a",
    icon: Sprout,
  },
  "fertilizantes-foliares": {
    id: "fertilizantes-foliares",
    label: "Fertilizantes foliares",
    color: "#059669",
    icon: Leaf,
  },
  fungicidas: {
    id: "fungicidas",
    label: "Fungicidas",
    color: "#2563eb",
    icon: Pill,
  },
  herbicidas: {
    id: "herbicidas",
    label: "Herbicidas",
    color: "#ea580c",
    icon: Zap,
  },
  insecticidas: {
    id: "insecticidas",
    label: "Insecticidas",
    color: "#dc2626",
    icon: Bug,
  },
  otros: {
    id: "otros",
    label: "Otros insumos",
    color: "#64748b",
    icon: MoreHorizontal,
  },
};

const categoriaLabels: Record<string, string> = {
  insumos: "Insumos",
  combustible: "Combustible",
  "mano-obra": "Mano de Obra",
  energia: "Energía",
  cosecha: "Cosecha",
  "gastos-admin": "Administración",
  mantenimientos: "Mantenimientos",
  "costos-oportunidad": "Oportunidad",
  otros: "Otros",
};

const categoriaColors: Record<string, string> = {
  insumos: "#16af92",
  combustible: "#22469c",
  "mano-obra": "#ba995c",
  energia: "#f2c02b",
  cosecha: "#f2794a",
  "gastos-admin": "#762c4d",
  mantenimientos: "#cb2030",
  "costos-oportunidad": "#bc5930",
  otros: "#64748b",
};

// Formateadores numéricos de estilo argentino (como en los screenshots)
const formatCurrency = (val: number) => {
  return `$${Math.round(val).toLocaleString("es-AR")}`;
};

const formatDecimal = (val: number, decimals = 2) => {
  return val.toLocaleString("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const Costos = () => {
  const { currentProjectId, campaigns, currentCampaign, setCurrentCampaign, costsLoading, montes, initialYear } = useApp();
  const costs = useDataStore((state) => state.costs);
  const addCost = useDataStore((state) => state.addCost);
  const updateCost = useDataStore((state) => state.updateCost);
  const deleteCost = useDataStore((state) => state.deleteCost);
  const loadAllProductions = useDataStore((state) => state.loadAllProductions);
  const productions = useDataStore((state) => state.productions);
  const {
    getCostByCategory,
    getTotalCostsByCampaign,
    getTotalProductionByCampaign,
    getCostPerHaByCategory,
    getCostPerKgByCategory,
    getCostPerHaByRubro,
    getCostPerKgByRubro,
    getInsumosBreakdown,
    getInsumosCostPerHa,
    getInsumosCostPerKg,
    getTotalCostsVariation,
    getCostPerHaVariation,
    getCostPerKgVariation,
    getProductionPerHaVariation,
  } = useCalculationsStore();

  // Tabs principales: "resumen" | "historico" | "comparaciones"
  const [activeTab, setActiveTab] = useState<"resumen" | "historico" | "comparaciones">("resumen");

  // Filtros de evolución histórica
  const [selectedHistoricalRubro, setSelectedHistoricalRubro] = useState<string>("all");
  const [timeRangeFilter, setTimeRangeFilter] = useState<"all" | "last3" | "last5" | "custom">("all");
  const [mostrarCostoKg, setMostrarCostoKg] = useState<boolean>(true);

  // Modal intervalo de años (Screenshot 3)
  const [intervalModalOpen, setIntervalModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"filtrar" | "comparar">("filtrar");
  const [modalRadioOption, setModalRadioOption] = useState<"last3" | "last5" | "custom">("custom");
  const [customStartYear, setCustomStartYear] = useState<number>(2010);
  const [customEndYear, setCustomEndYear] = useState<number>(2026);

  // Sheets y diálogos de edición / eliminación
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCosto, setEditingCosto] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [costoToDelete, setCostoToDelete] = useState<any>(null);

  // Cargar producciones para calcular Kilos Reales Cosechados
  useEffect(() => {
    if (campaigns && campaigns.length > 0) {
      loadAllProductions(campaigns);
    }
  }, [campaigns, loadAllProductions]);

  // Selección segura de la campaña actual
  const currentCampaignObj = useMemo(() => {
    return campaigns.find((c) => Number(c.year) === Number(currentCampaign));
  }, [campaigns, currentCampaign]);

  // Total costos operativos de la campaña actual
  const totalCostos = currentCampaignObj ? getTotalCostsByCampaign(currentCampaignObj.id) : 0;

  // Total área plantada hasta la campaña actual
  const totalAreaPlantada = useMemo(() => {
    return montes
      .filter((monte) => monte.añoPlantacion <= currentCampaign)
      .reduce((sum, monte) => sum + monte.hectareas, 0);
  }, [montes, currentCampaign]);

  // Costo total por hectárea
  const costoPorHectarea = totalAreaPlantada > 0 ? totalCostos / totalAreaPlantada : 0;

  // Kilos cosechados en la campaña actual
  const totalKilos = currentCampaignObj ? getTotalProductionByCampaign(currentCampaignObj.id) : 0;

  // Kilos cosechados por hectárea en la campaña actual
  const kilosPorHectarea = totalAreaPlantada > 0 ? totalKilos / totalAreaPlantada : 0;

  // Costo por Kilo
  const costoPorKilo = totalKilos > 0 ? totalCostos / totalKilos : 0;

  // Costos registrados filtrados para la campaña actual
  const costosFiltered = useMemo(() => {
    if (!currentCampaignObj) return [];
    return costs.filter((c: any) => String(c.campaign_id) === String(currentCampaignObj.id));
  }, [costs, currentCampaignObj]);

  // Costos por categoría de la campaña actual
  const costsByCategory = useMemo(() => {
    if (!currentCampaignObj) return {};
    return getCostByCategory(currentCampaignObj.id);
  }, [currentCampaignObj, getCostByCategory, costs]);

  // Costos por hectárea por categoría de la campaña actual
  const costsPerHaByCategory = useMemo(() => {
    if (!currentCampaignObj || totalAreaPlantada <= 0) return {};
    return getCostPerHaByCategory(currentCampaignObj.id, totalAreaPlantada);
  }, [currentCampaignObj, getCostPerHaByCategory, totalAreaPlantada, costs]);

  // Costos por kilo por categoría de la campaña actual
  const costsPerKgByCategory = useMemo(() => {
    if (!currentCampaignObj || totalKilos <= 0) return {};
    return getCostPerKgByCategory(currentCampaignObj.id, totalKilos);
  }, [currentCampaignObj, getCostPerKgByCategory, totalKilos, costs]);

  // Funciones específicas para calcular costos/ha y costos/kg por rubro
  const calcularCostoPorHaRubro = useCallback(
    (category: string) => {
      if (!currentCampaignObj || totalAreaPlantada <= 0) return 0;
      return getCostPerHaByRubro(currentCampaignObj.id, category, totalAreaPlantada);
    },
    [currentCampaignObj, totalAreaPlantada, getCostPerHaByRubro, costs]
  );

  const calcularCostoPorKgRubro = useCallback(
    (category: string) => {
      if (!currentCampaignObj || totalKilos <= 0) return 0;
      return getCostPerKgByRubro(currentCampaignObj.id, category, totalKilos);
    },
    [currentCampaignObj, totalKilos, getCostPerKgByRubro, costs]
  );

  // Insumos breakdown y costos por ha y kg
  const insumosBreakdown = useMemo(() => {
    if (!currentCampaignObj) return {};
    return getInsumosBreakdown(currentCampaignObj.id);
  }, [currentCampaignObj, getInsumosBreakdown, costs]);

  const insumosCostPerHa = useMemo(() => {
    if (!currentCampaignObj || totalAreaPlantada <= 0) return {};
    return getInsumosCostPerHa(currentCampaignObj.id, totalAreaPlantada);
  }, [currentCampaignObj, getInsumosCostPerHa, totalAreaPlantada, costs]);

  const insumosCostPerKg = useMemo(() => {
    if (!currentCampaignObj || totalKilos <= 0) return {};
    return getInsumosCostPerKg(currentCampaignObj.id, totalKilos);
  }, [currentCampaignObj, getInsumosCostPerKg, totalKilos, costs]);

  const totalInsumosAmount = useMemo(() => {
    return Object.values(insumosBreakdown).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [insumosBreakdown]);

  const totalInsumosCostoPorHa = totalAreaPlantada > 0 ? totalInsumosAmount / totalAreaPlantada : 0;
  const totalInsumosCostoPorKg = totalKilos > 0 ? totalInsumosAmount / totalKilos : 0;

  // Lista de insumos para la tabla de detalle de insumos
  const insumosList = useMemo(() => {
    return Object.entries(INSUMOS_CONFIG).map(([key, config]) => {
      const amount = insumosBreakdown[key] || 0;
      const costoPorHa =
        insumosCostPerHa[key] ?? (totalAreaPlantada > 0 ? amount / totalAreaPlantada : 0);
      const costoPorKg =
        insumosCostPerKg[key] ?? (totalKilos > 0 ? amount / totalKilos : 0);
      return {
        key,
        label: config.label,
        color: config.color,
        icon: config.icon,
        amount,
        costoPorHa,
        costoPorKg,
      };
    });
  }, [insumosBreakdown, insumosCostPerHa, insumosCostPerKg, totalAreaPlantada, totalKilos]);

  // Campañas ordenadas para navegación previa / siguiente
  const sortedCampaignYears = useMemo(() => {
    const years = Array.from(new Set(campaigns.map((c) => Number(c.year)))).sort((a, b) => a - b);
    return years;
  }, [campaigns]);

  const currentYearNum = Number(currentCampaign);
  const currentYearIndex = sortedCampaignYears.indexOf(currentYearNum);
  const prevCampaignYear = currentYearIndex > 0 ? sortedCampaignYears[currentYearIndex - 1] : null;
  const nextCampaignYear =
    currentYearIndex >= 0 && currentYearIndex < sortedCampaignYears.length - 1
      ? sortedCampaignYears[currentYearIndex + 1]
      : null;

  // Campaña anterior y su superficie plantada
  const prevCampaignObj = useMemo(() => {
    if (!prevCampaignYear) return null;
    return campaigns.find((c) => Number(c.year) === Number(prevCampaignYear)) || null;
  }, [campaigns, prevCampaignYear]);

  const prevTotalAreaPlantada = useMemo(() => {
    if (!prevCampaignYear) return 0;
    return montes
      .filter((monte) => monte.añoPlantacion <= prevCampaignYear)
      .reduce((sum, monte) => sum + monte.hectareas, 0);
  }, [montes, prevCampaignYear]);

  // Variaciones de las 4 KPIs respecto a la campaña anterior
  const totalCostosVariation = useMemo(() => {
    if (!currentCampaignObj) return { current: 0, previous: 0, diff: 0, percentage: null };
    return getTotalCostsVariation(currentCampaignObj.id, prevCampaignObj?.id);
  }, [currentCampaignObj, prevCampaignObj, getTotalCostsVariation, costs]);

  const costoPorHaVariation = useMemo(() => {
    if (!currentCampaignObj) return { current: 0, previous: 0, diff: 0, percentage: null };
    return getCostPerHaVariation(
      currentCampaignObj.id,
      prevCampaignObj?.id,
      totalAreaPlantada,
      prevTotalAreaPlantada
    );
  }, [
    currentCampaignObj,
    prevCampaignObj,
    totalAreaPlantada,
    prevTotalAreaPlantada,
    getCostPerHaVariation,
    costs,
  ]);

  const costoPorKgVariation = useMemo(() => {
    if (!currentCampaignObj) return { current: 0, previous: 0, diff: 0, percentage: null };
    return getCostPerKgVariation(currentCampaignObj.id, prevCampaignObj?.id);
  }, [currentCampaignObj, prevCampaignObj, getCostPerKgVariation, costs, productions]);


  const kilosPorHaVariation = useMemo(() => {
    if (!currentCampaignObj) return { current: 0, previous: 0, diff: 0, percentage: null };
    return getProductionPerHaVariation(
      currentCampaignObj.id,
      prevCampaignObj?.id,
      totalAreaPlantada,
      prevTotalAreaPlantada
    );
  }, [
    currentCampaignObj,
    prevCampaignObj,
    totalAreaPlantada,
    prevTotalAreaPlantada,
    getProductionPerHaVariation,
    productions,
  ]);

  // Lista de rubros con desglose y porcentajes para la campaña actual (orden descendente)
  const breakdownList = useMemo(() => {
    return Object.entries(CATEGORIES_CONFIG)
      .map(([key, config]) => {
        const amount = costsByCategory[key] || 0;
        const percentage = totalCostos > 0 ? (amount / totalCostos) * 100 : 0;
        return {
          key,
          label: config.label,
          color: config.color,
          amount,
          percentage,
        };
      })
      .sort((a, b) => {
        if (b.percentage !== a.percentage) {
          return b.percentage - a.percentage;
        }
        return a.label.localeCompare(b.label);
      });
  }, [costsByCategory, totalCostos]);

  // Datos para el Donut Chart
  const donutData = useMemo(() => {
    const activeSlices = breakdownList.filter((item) => item.amount > 0);
    if (activeSlices.length === 0) {
      return [{ name: "Sin costos", value: 1, color: "#e5e0d8", percentage: 0 }];
    }
    return activeSlices.map((item) => ({
      name: item.label,
      value: item.amount,
      color: item.color,
      percentage: item.percentage,
    }));
  }, [breakdownList]);

  // Rubros que tienen costos en esta campaña para la tabla de "Detalle de Costos"
  const registeredCategoriesList = useMemo(() => {
    return Object.entries(CATEGORIES_CONFIG)
      .filter(([key]) => (costsByCategory[key] || 0) > 0)
      .map(([key, config]) => {
        const amount = costsByCategory[key] || 0;
        const matchingCost = costosFiltered.find((c: any) => c.category === key);
        const costoPorHa =
          costsPerHaByCategory[key] !== undefined
            ? costsPerHaByCategory[key]
            : calcularCostoPorHaRubro(key);
        const costoPorKg =
          costsPerKgByCategory[key] !== undefined
            ? costsPerKgByCategory[key]
            : calcularCostoPorKgRubro(key);
        return {
          key,
          label: config.label,
          color: config.color,
          icon: config.icon,
          amount,
          costoPorHa,
          costoPorKg,
          cost: matchingCost,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [
    costsByCategory,
    costosFiltered,
    costsPerHaByCategory,
    costsPerKgByCategory,
    calcularCostoPorHaRubro,
    calcularCostoPorKgRubro,
  ]);

  // Historial: Años disponibles en el sistema (min 2010 a max 2026 por defecto como en el screenshot)
  const allHistoricalYears = useMemo(() => {
    const years = campaigns.map((c) => Number(c.year)).filter(Boolean);
    if (initialYear) years.push(Number(initialYear));
    const curYear = new Date().getFullYear();
    years.push(curYear);

    const min = Math.min(...years, 2010);
    const max = Math.max(...years, 2026);

    const result: number[] = [];
    for (let y = min; y <= max; y++) {
      result.push(y);
    }
    return result;
  }, [campaigns, initialYear]);

  // Años a mostrar según el filtro seleccionado
  const displayedHistoricalYears = useMemo(() => {
    if (timeRangeFilter === "last3") {
      return allHistoricalYears.slice(-3);
    }
    if (timeRangeFilter === "last5") {
      return allHistoricalYears.slice(-5);
    }
    if (timeRangeFilter === "custom") {
      return allHistoricalYears.filter((y) => y >= customStartYear && y <= customEndYear);
    }
    return allHistoricalYears;
  }, [allHistoricalYears, timeRangeFilter, customStartYear, customEndYear]);

  // Datos para el gráfico de barras y líneas histórico
  const historicalChartData = useMemo(() => {
    return displayedHistoricalYears.map((year) => {
      const campaign = campaigns.find((c) => Number(c.year) === year);
      let costTotal = 0;
      let totalKilosYear = 0;

      if (campaign) {
        if (selectedHistoricalRubro === "all") {
          costTotal = getTotalCostsByCampaign(campaign.id);
        } else {
          const catCosts = getCostByCategory(campaign.id);
          costTotal = catCosts[selectedHistoricalRubro] || 0;
        }
        totalKilosYear = getTotalProductionByCampaign(campaign.id);
      }

      const costoKilo = totalKilosYear > 0 ? costTotal / totalKilosYear : 0;

      return {
        year: String(year),
        costTotal,
        costoKilo,
      };
    });
  }, [
    displayedHistoricalYears,
    campaigns,
    selectedHistoricalRubro,
    getTotalCostsByCampaign,
    getCostByCategory,
    getTotalProductionByCampaign,
    costs,
  ]);

  const currentYear = new Date().getFullYear();

  // Helper para la tabla de evolución
  const getCostForCategoryAndYear = (category: string, year: number): number => {
    const campaign = campaigns.find((c) => Number(c.year) === year);
    if (!campaign) return 0;
    const costsByCategory = getCostByCategory(campaign.id);
    return costsByCategory[category] || 0;
  };

  const displayedYears = useMemo(() => {
    if (campaigns.length === 0) return [];
    const sorted = campaigns.map((c) => Number(c.year)).sort((a, b) => a - b);
    if (timeRangeFilter === "last3") return sorted.slice(-3);
    if (timeRangeFilter === "last5") return sorted.slice(-5);
    if (timeRangeFilter === "custom") return sorted.filter((y) => y >= customStartYear && y <= customEndYear);
    return sorted;
  }, [campaigns, timeRangeFilter, customStartYear, customEndYear]);

  // Handlers para editar y eliminar
  const handleEditCategory = (categoryKey: string) => {
    const existing = costosFiltered.find((c: any) => c.category === categoryKey);
    if (existing) {
      setEditingCosto(existing);
    } else {
      setEditingCosto({
        category: categoryKey,
        total_amount: 0,
        campaign_id: currentCampaignObj?.id,
        project_id: currentProjectId,
      });
    }
    setSheetOpen(true);
  };

  const handleDeleteCategory = (categoryKey: string) => {
    const existing = costosFiltered.find((c: any) => c.category === categoryKey);
    if (existing) {
      setCostoToDelete(existing);
      setDeleteDialogOpen(true);
    } else {
      toast.info("No hay un registro individual para eliminar.");
    }
  };

  const confirmDelete = async () => {
    if (costoToDelete) {
      try {
        await deleteCost(costoToDelete.id);
        toast.success("Costo eliminado correctamente");
      } catch (error) {
        toast.error("Error al eliminar el costo");
        console.error("Error deleting cost:", error);
      }
    }
    setDeleteDialogOpen(false);
    setCostoToDelete(null);
  };

  const handleUpdateCosto = async (categoriaOrData: string | any, formData?: any) => {
    if (!currentProjectId) {
      toast.error("No hay proyecto activo");
      return;
    }

    if (!currentCampaignObj) {
      toast.error("No se pudo encontrar la campaña actual");
      return;
    }

    try {
      if (typeof categoriaOrData === "object" && categoriaOrData.category) {
        const costData = categoriaOrData;
        if (costData.existingId) {
          await updateCost(costData.existingId, {
            category: costData.category,
            details: costData.details,
            total_amount: costData.total_amount,
          });
          toast.success("Costo actualizado");
        } else {
          await addCost({
            project_id: currentProjectId,
            campaign_id: currentCampaignObj.id,
            category: costData.category,
            details: costData.details,
            total_amount: costData.total_amount,
          });
          toast.success("Costo registrado");
        }
      } else if (typeof formData === "object" && formData.category) {
        if (formData.existingId) {
          await updateCost(formData.existingId, {
            category: formData.category,
            details: formData.details,
            total_amount: formData.total_amount,
          });
          toast.success("Costo actualizado");
        } else {
          await addCost({
            project_id: currentProjectId,
            campaign_id: currentCampaignObj.id,
            category: formData.category,
            details: formData.details,
            total_amount: formData.total_amount,
          });
          toast.success("Costo registrado");
        }
      } else if (editingCosto) {
        const categoria = categoriaOrData as string;
        await updateCost(editingCosto.id, {
          category: categoria,
          details: formData,
          total_amount: formData?.total || formData?.total_amount || 0,
        });
        toast.success("Costo actualizado");
        setEditingCosto(null);
      } else {
        const categoria = categoriaOrData as string;
        await addCost({
          project_id: currentProjectId,
          campaign_id: currentCampaignObj.id,
          category: categoria,
          details: formData,
          total_amount: formData?.total || formData?.total_amount || 0,
        });
        toast.success("Costo registrado");
      }
    } catch (error) {
      toast.error("Error al guardar el costo");
      console.error("Error saving cost:", error);
    }
  };

  // Aplicar selección del modal intervalo de años
  const handleApplyIntervalModal = () => {
    if (modalRadioOption === "last3") {
      setTimeRangeFilter("last3");
    } else if (modalRadioOption === "last5") {
      setTimeRangeFilter("last5");
    } else {
      setTimeRangeFilter("custom");
    }
    setIntervalModalOpen(false);
  };

  if (costsLoading) {
    return (
      <div className="flex justify-center items-center h-72">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground font-medium">Cargando costos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary tracking-tight">
            Costos Operativos
          </h1>
        </div>
        <Button
          onClick={() => {
            setEditingCosto(null);
            setSheetOpen(true);
          }}
          className="bg-[#4a3e39] hover:bg-[#3d322d] text-white px-5 py-2.5 rounded-xl font-medium gap-2 shadow-xs transition-colors"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          Nuevo Costo
        </Button>
      </div>

      {/* Selector de Tabs Principales (Pill Bar) */}
      <div className="inline-flex p-1 bg-[#f6ebd8] rounded-xl border border-[#ede1cb]">
        <button
          onClick={() => setActiveTab("resumen")}
          className={cn(
            "px-5 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "resumen"
              ? "bg-white text-primary hover:text-accent shadow-xs font-semibold"
              : "text-[#8c7b70] hover:text-accent"
          )}
        >
          Resumen de campaña {currentCampaign}
        </button>
        <button
          onClick={() => setActiveTab("historico")}
          className={cn(
            "px-5 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "historico"
              ? "bg-white text-primary hover:text-accent shadow-xs font-semibold"
              : "text-[#8c7b70] hover:text-accent"
          )}
        >
          Evolución histórica
        </button>
        <button
          onClick={() => setActiveTab("comparaciones")}
          className={cn(
            "px-5 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "comparaciones"
              ? "bg-white text-primary hover:text-accent shadow-xs font-semibold"
              : "text-[#8c7b70] hover:text-accent"
          )}
        >
          Comparaciones
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: RESUMEN DE CAMPAÑA ACTUAL                         */}
      {/* ========================================================= */}
      {activeTab === "resumen" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Navegación entre campañas */}
          <div className="flex items-center justify-between gap-4 text-sm pt-1">
            <div className="flex-1 flex justify-start">
              <button
                onClick={() => prevCampaignYear && setCurrentCampaign(prevCampaignYear)}
                disabled={!prevCampaignYear}
                className={cn(
                  "flex items-center gap-1.5 font-medium transition-colors",
                  prevCampaignYear
                    ? "text-[#8c735d] hover:text-[#524135] cursor-pointer"
                    : "text-[#c2b6ab] cursor-not-allowed opacity-50"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Campaña anterior</span>
              </button>
            </div>

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-primary text-center tracking-tight px-2">
              {currentCampaignObj?.campaign_name
                ? currentCampaignObj.campaign_name.toLowerCase().includes("campaña")
                  ? currentCampaignObj.campaign_name
                  : `Campaña ${currentCampaignObj.campaign_name}`
                : `Campaña ${currentCampaign}`}
            </h2>

            <div className="flex-1 flex justify-end">
              <button
                onClick={() => nextCampaignYear && setCurrentCampaign(nextCampaignYear)}
                disabled={!nextCampaignYear}
                className={cn(
                  "flex items-center gap-1.5 font-medium transition-colors",
                  nextCampaignYear
                    ? "text-[#8c735d] hover:text-[#524135] cursor-pointer"
                    : "text-[#c2b6ab] cursor-not-allowed opacity-50"
                )}
              >
                <span>Siguiente campaña</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Fila Superior: KPIs (2x2), Desglose %, Gráfico Circular a la misma altura */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
            {/* Columna 1 y 2: Matriz 2x2 de KPIs (2 columnas y 2 filas) */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">

              {/* Card 1: Total Costos Operativos */}
              <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-xs flex flex-col justify-between shadow-md h-full overflow-hidden">
                <div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 md:w-5 md:h-5 text-[#e08a28] shrink-0 stroke-[2.2]" />
                    <p className="text-xs md:text-lg font-semibold text-primary">
                      Costo Total Operativo
                    </p>
                  </div>
                  <div className="flex items-baseline justify-between flex-wrap gap-2 mt-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                      ${formatDecimal(totalCostos, 2)}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-[#8f827a]">
                      USD
                    </span>
                    {totalCostosVariation.percentage !== null && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-semibold border",
                          totalCostosVariation.diff > 0
                            ? "bg-rose-50 text-rose-700 border-rose-200/80"
                            : totalCostosVariation.diff < 0
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                              : "bg-stone-50 text-stone-600 border-stone-200"
                        )}
                      >
                        {totalCostosVariation.diff > 0 ? (
                          <TrendingUp className="w-3 h-3 text-rose-600" />
                        ) : totalCostosVariation.diff < 0 ? (
                          <TrendingDown className="w-3 h-3 text-emerald-600" />
                        ) : null}
                        {totalCostosVariation.diff > 0 ? "+" : ""}
                        {formatDecimal(totalCostosVariation.percentage, 1)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer valor absoluto */}
                <div className="-mx-5 -mb-5 mt-4 px-5 py-3 bg-background border-t border-stone-200/60 text-xs text-primary flex items-center justify-between">
                  <span className="font-medium">
                    {!prevCampaignYear
                      ? "Sin campaña anterior"
                      : totalCostosVariation.diff > 0
                        ? `${formatCurrency(Math.abs(totalCostosVariation.diff))} más esta campaña`
                        : totalCostosVariation.diff < 0
                          ? `${formatCurrency(Math.abs(totalCostosVariation.diff))} menos esta campaña`
                          : "Mismo total que la campaña anterior"}
                  </span>
                  {prevCampaignYear && (
                    <span className="text-[10px] text-primary/70 font-normal">vs {prevCampaignYear}</span>
                  )}
                </div>
              </div>

              {/* Card 2: Kilos Cosechados por ha */}
              <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-xs flex flex-col justify-between shadow-md h-full overflow-hidden">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Wheat className="w-3.5 h-3.5 md:w-5 md:h-5 text-[#f2794a] shrink-0 stroke-[2.2]" />
                    <p className="text-xs md:text-lg font-semibold text-primary">
                      Kilos Cosechados por ha
                    </p>
                  </div>
                  <div className="flex items-baseline justify-between flex-wrap gap-2 mt-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                      {formatDecimal(kilosPorHectarea, 2)}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-[#8f827a]">
                      Kg/Ha
                    </span>
                    {kilosPorHaVariation.percentage !== null && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-semibold border",
                          kilosPorHaVariation.diff > 0
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                            : kilosPorHaVariation.diff < 0
                              ? "bg-rose-50 text-rose-700 border-rose-200/80"
                              : "bg-stone-50 text-stone-600 border-stone-200"
                        )}
                      >
                        {kilosPorHaVariation.diff > 0 ? (
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                        ) : kilosPorHaVariation.diff < 0 ? (
                          <TrendingDown className="w-3 h-3 text-rose-600" />
                        ) : null}
                        {kilosPorHaVariation.diff > 0 ? "+" : ""}
                        {formatDecimal(kilosPorHaVariation.percentage, 1)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer valor absoluto */}
                <div className="-mx-5 -mb-5 mt-4 px-5 py-3 bg-background border-t border-stone-200/60 text-xs text-primary flex items-center justify-between">
                  <span className="font-medium">
                    {!prevCampaignYear
                      ? "Sin campaña anterior"
                      : kilosPorHaVariation.diff > 0
                        ? `${formatDecimal(Math.abs(kilosPorHaVariation.diff), 2)} kg/ha más esta campaña`
                        : kilosPorHaVariation.diff < 0
                          ? `${formatDecimal(Math.abs(kilosPorHaVariation.diff), 2)} kg/ha menos esta campaña`
                          : "Misma cosecha/ha que la campaña anterior"}
                  </span>
                  {prevCampaignYear && (
                    <span className="text-[10px] text-primary/70 font-normal">vs {prevCampaignYear}</span>
                  )}
                </div>
              </div>

              {/* Card 3: Costo Total por ha */}
              <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-xs flex flex-col justify-between shadow-md h-full overflow-hidden">
                <div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 md:w-5 md:h-5 text-[#3b82f6] shrink-0 stroke-[2.2]" />
                    <p className="text-xs md:text-lg font-semibold text-primary">
                      Costo Total por ha
                    </p>
                  </div>
                  <div className="flex items-baseline justify-between flex-wrap gap-2 mt-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                      ${formatDecimal(costoPorHectarea, 2)}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-[#8f827a]">
                      USD/Ha
                    </span>
                    {costoPorHaVariation.percentage !== null && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-semibold border",
                          costoPorHaVariation.diff > 0
                            ? "bg-rose-50 text-rose-700 border-rose-200/80"
                            : costoPorHaVariation.diff < 0
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                              : "bg-stone-50 text-stone-600 border-stone-200"
                        )}
                      >
                        {costoPorHaVariation.diff > 0 ? (
                          <TrendingUp className="w-3 h-3 text-rose-600" />
                        ) : costoPorHaVariation.diff < 0 ? (
                          <TrendingDown className="w-3 h-3 text-emerald-600" />
                        ) : null}
                        {costoPorHaVariation.diff > 0 ? "+" : ""}
                        {formatDecimal(costoPorHaVariation.percentage, 1)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer valor absoluto */}
                <div className="-mx-5 -mb-5 mt-4 px-5 py-3 bg-background border-t border-stone-200/60 text-xs text-primary flex items-center justify-between">
                  <span className="font-medium">
                    {!prevCampaignYear
                      ? "Sin campaña anterior"
                      : costoPorHaVariation.diff > 0
                        ? `$${formatDecimal(Math.abs(costoPorHaVariation.diff), 2)} USD/Ha más esta campaña`
                        : costoPorHaVariation.diff < 0
                          ? `$${formatDecimal(Math.abs(costoPorHaVariation.diff), 2)} USD/Ha menos esta campaña`
                          : "Mismo costo/ha que la campaña anterior"}
                  </span>
                  {prevCampaignYear && (
                    <span className="text-[10px] text-primary/70 font-normal">vs {prevCampaignYear}</span>
                  )}
                </div>
              </div>

              {/* Card 4: Costo por Kilo */}
              <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-xs flex flex-col justify-between shadow-md h-full overflow-hidden">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 md:w-5 md:h-5 text-[#10b981] shrink-0 stroke-[2.2]" />
                    <p className="text-xs md:text-lg font-semibold text-primary">
                      Costo Total por Kilo
                    </p>
                  </div>
                  <div className="flex items-baseline justify-between flex-wrap gap-2 mt-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                      ${formatDecimal(costoPorKilo, 2)}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-[#8f827a]">
                      USD/Kg
                    </span>
                    {costoPorKgVariation.percentage !== null && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-semibold border",
                          costoPorKgVariation.diff > 0
                            ? "bg-rose-50 text-rose-700 border-rose-200/80"
                            : costoPorKgVariation.diff < 0
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                              : "bg-stone-50 text-stone-600 border-stone-200"
                        )}
                      >
                        {costoPorKgVariation.diff > 0 ? (
                          <TrendingUp className="w-3 h-3 text-rose-600" />
                        ) : costoPorKgVariation.diff < 0 ? (
                          <TrendingDown className="w-3 h-3 text-emerald-600" />
                        ) : null}
                        {costoPorKgVariation.diff > 0 ? "+" : ""}
                        {formatDecimal(costoPorKgVariation.percentage, 1)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer valor absoluto */}
                <div className="-mx-5 -mb-5 mt-4 px-5 py-3 bg-background border-t border-stone-200/60 text-xs text-primary flex items-center justify-between">
                  <span className="font-medium">
                    {!prevCampaignYear
                      ? "Sin campaña anterior"
                      : costoPorKgVariation.diff > 0
                        ? `$${formatDecimal(Math.abs(costoPorKgVariation.diff), 2)} USD/Kg más esta campaña`
                        : costoPorKgVariation.diff < 0
                          ? `$${formatDecimal(Math.abs(costoPorKgVariation.diff), 2)} USD/Kg menos esta campaña`
                          : "Mismo costo/kg que la campaña anterior"}
                  </span>
                  {prevCampaignYear && (
                    <span className="text-[10px] text-primary/70 font-normal">vs {prevCampaignYear}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Columna 3: Card de Desglose de Costos (Barras de %) */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-stone-200/60 p-6 shadow-xs flex flex-col justify-between shadow-md">
              <h2 className="text-base md:text-lg font-bold text-primary mb-6">
                Desglose de Costos
              </h2>

              <div className="space-y-3.5 flex-1">
                {breakdownList.map((item) => (
                  <div key={item.key} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-[#2b2623]">{item.label}</span>
                      <span className="font-semibold text-[#2b2623]">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-[#f6f2ec] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(item.percentage, 0)}%`,
                          backgroundColor: item.percentage > 0 ? item.color : "#d6d0c7",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna 4: Card con el Gráfico Circular y Etiquetas Horizontales */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-stone-200/60 p-6 shadow-xs flex flex-col justify-between shadow-md">
              <h2 className="text-base md:text-lg font-bold text-primary mb-2">
                Distribución de Costos por rubros
              </h2>

              <div className="relative flex items-center justify-center flex-1 min-h-[240px]">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={95}
                      paddingAngle={donutData.length > 1 ? 2.5 : 0}
                      stroke="none"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`donut-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => {
                        if (totalCostos === 0) return ["$0 (0%)", name];
                        const pct = ((Number(val) / totalCostos) * 100).toFixed(1);
                        return [`${formatCurrency(Number(val))} (${pct}%)`, name];
                      }}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #ede8e1",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Texto en el hueco del donut: Valor del costo total operativo */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2 text-center">
                  <span className="text-xl font-extrabold text-primary tracking-tight">
                    {formatCurrency(totalCostos)}
                  </span>
                  <span className="text-[9px] font-bold tracking-widest text-[#8f827a] uppercase mt-0.5">
                    Total Operativo
                  </span>
                </div>
              </div>

              {/* Etiquetas debajo del gráfico circular (una a la par de la otra, no apiladas) */}
              {breakdownList.some((item) => item.amount > 0) && (
                <div className="pt-3 mt-3">
                  <p className="text-sm text-center text-[#8f827a] font-medium mb-3">
                    Valores en $ USD
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mt-2">
                    {breakdownList
                      .filter((item) => item.amount > 0)
                      .map((item) => (
                        <div
                          key={item.key}
                          className="inline-flex items-center gap-1.5 text-xs text-[#8f827a] px-2 py-1 whitespace-nowrap"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium">
                            {item.label}:{" "}
                            <span className="text-[#8f827a]">
                              {formatCurrency(item.amount)}
                            </span>
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Fila Inferior: Detalle de Costos y Detalle de Insumos (en la misma fila) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            {/* Tabla 1: Detalle de Costos campaña */}
            <div className="w-full bg-white rounded-2xl border border-stone-200/60 p-6 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base md:text-lg font-bold text-primary">
                  Detalle de Costos campaña {currentCampaign}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingCosto(null);
                    setSheetOpen(true);
                  }}
                  className="border-[#d5cdc4] text-[#4a3e39] hover:text-primary hover:bg-stone-50 rounded-xl px-3 py-1.5 text-xs font-semibold gap-1.5 h-8 shadow-2xs"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar costos
                </Button>
              </div>

              {/* Tabla de detalle */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e8e2d9] text-xs text-[#8f827a] font-medium">
                      <th className="text-left pb-3 font-medium">Rubro/Categoría</th>
                      <th className="text-right pb-3 font-medium pr-4">Total</th>
                      <th className="text-right pb-3 font-medium pr-4">Costo / ha</th>
                      <th className="text-right pb-3 font-medium pr-4">Costo / kg</th>
                      <th className="text-right pb-3 font-medium w-24 pr-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2ece3]">
                    {registeredCategoriesList.length > 0 ? (
                      registeredCategoriesList.map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <tr key={item.key} className="hover:bg-stone-50/60 transition-colors">
                            <td className="py-3.5 text-left">
                              <div className="flex items-center gap-2">
                                <IconComponent
                                  className="w-4 h-4 shrink-0"
                                  style={{ color: item.color }}
                                />
                                <span className="font-medium text-[#2b2623] text-sm whitespace-nowrap">
                                  {item.label}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 text-right font-semibold text-[#2b2623] text-sm pr-4 whitespace-nowrap">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="py-3.5 text-right text-sm text-[#2b2623] pr-4 whitespace-nowrap">
                              <span className="font-semibold">
                                ${formatDecimal(item.costoPorHa, 2)}
                              </span>
                              <span className="text-xs text-[#8f827a] font-normal ml-1">
                                USD/Ha
                              </span>
                            </td>
                            <td className="py-3.5 text-right text-sm text-[#2b2623] pr-4 whitespace-nowrap">
                              <span className="font-semibold">
                                ${formatDecimal(item.costoPorKg, 2)}
                              </span>
                              <span className="text-xs text-[#8f827a] font-normal ml-1">
                                USD/Kg
                              </span>
                            </td>
                            <td className="py-3.5 text-right pr-2 whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2.5 text-stone-400">
                                <button
                                  onClick={() => handleEditCategory(item.key)}
                                  className="hover:text-stone-700 transition-colors cursor-pointer"
                                  title="Ver detalle"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditCategory(item.key)}
                                  className="hover:text-stone-700 transition-colors cursor-pointer"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(item.key)}
                                  className="hover:text-red-600 transition-colors cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-[#8f827a]">
                          <p className="text-sm">
                            No hay costos registrados para la campaña {currentCampaign}.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCosto(null);
                              setSheetOpen(true);
                            }}
                            className="mt-3 gap-1.5 text-xs rounded-xl border-[#d5cdc4] text-[#4a3e39]"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Registrar Costo
                          </Button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {registeredCategoriesList.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-[#e8e2d9] bg-[#faf8f5]/60 font-semibold text-xs text-[#2b2623]">
                        <td className="py-3.5 text-left font-bold text-sm text-primary">
                          Total Operativo
                        </td>
                        <td className="py-3.5 text-right font-bold text-sm text-primary pr-4 whitespace-nowrap">
                          {formatCurrency(totalCostos)}
                        </td>
                        <td className="py-3.5 text-right text-sm font-bold text-primary pr-4 whitespace-nowrap">
                          ${formatDecimal(costoPorHectarea, 2)}{" "}
                          <span className="text-xs font-normal text-[#8f827a]">USD/Ha</span>
                        </td>
                        <td className="py-3.5 text-right text-sm font-bold text-primary pr-4 whitespace-nowrap">
                          ${formatDecimal(costoPorKilo, 2)}{" "}
                          <span className="text-xs font-normal text-[#8f827a]">USD/Kg</span>
                        </td>
                        <td className="py-3.5 pr-2"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Tabla 2: Detalle del rubro Insumos */}
            <div className="w-full bg-white rounded-2xl border border-stone-200/60 p-6 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#16af92]/10 flex items-center justify-center text-[#16af92]">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-primary">
                    Detalle de Insumos {currentCampaign}
                  </h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditCategory("insumos")}
                  className="border-[#d5cdc4] text-[#4a3e39] hover:text-primary hover:bg-stone-50 rounded-xl px-3 py-1.5 text-xs font-semibold gap-1.5 h-8 shadow-2xs"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar insumos
                </Button>
              </div>

              {/* Tabla de insumos */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e8e2d9] text-xs text-[#8f827a] font-medium">
                      <th className="text-left pb-3 font-medium">Insumo</th>
                      <th className="text-right pb-3 font-medium pr-4">Total</th>
                      <th className="text-right pb-3 font-medium pr-4">Costo / ha</th>
                      <th className="text-right pb-3 font-medium pr-4">Costo / kg</th>
                      <th className="text-right pb-3 font-medium w-16 pr-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2ece3]">
                    {totalInsumosAmount > 0 || insumosList.some((i) => i.amount > 0) ? (
                      insumosList.map((item) => {
                        const IconComponent = item.icon;
                        const hasValue = item.amount > 0;
                        return (
                          <tr key={item.key} className="hover:bg-stone-50/60 transition-colors">
                            <td className="py-3.5 text-left">
                              <div className="flex items-center gap-2">
                                <IconComponent
                                  className={cn("w-4 h-4 shrink-0", !hasValue && "opacity-50")}
                                  style={{ color: hasValue ? item.color : "#9ca3af" }}
                                />
                                <span
                                  className={cn(
                                    "text-sm whitespace-nowrap",
                                    hasValue
                                      ? "font-medium text-[#2b2623]"
                                      : "text-stone-400 font-normal"
                                  )}
                                >
                                  {item.label}
                                </span>
                              </div>
                            </td>
                            <td
                              className={cn(
                                "py-3.5 text-right text-sm pr-4 whitespace-nowrap",
                                hasValue
                                  ? "font-semibold text-[#2b2623]"
                                  : "text-stone-400 font-normal"
                              )}
                            >
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="py-3.5 text-right text-sm text-[#2b2623] pr-4 whitespace-nowrap">
                              <span
                                className={cn(
                                  hasValue ? "font-semibold" : "text-stone-400 font-normal"
                                )}
                              >
                                ${formatDecimal(item.costoPorHa, 2)}
                              </span>
                              <span className="text-xs text-[#8f827a] font-normal ml-1">
                                USD/Ha
                              </span>
                            </td>
                            <td className="py-3.5 text-right text-sm text-[#2b2623] pr-4 whitespace-nowrap">
                              <span
                                className={cn(
                                  hasValue ? "font-semibold" : "text-stone-400 font-normal"
                                )}
                              >
                                ${formatDecimal(item.costoPorKg, 2)}
                              </span>
                              <span className="text-xs text-[#8f827a] font-normal ml-1">
                                USD/Kg
                              </span>
                            </td>
                            <td className="py-3.5 text-right pr-2 whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2.5 text-stone-400">
                                <button
                                  onClick={() => handleEditCategory("insumos")}
                                  className="hover:text-stone-700 transition-colors cursor-pointer"
                                  title="Editar insumo"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-[#8f827a]">
                          <p className="text-sm">
                            No hay costos de insumos registrados para la campaña {currentCampaign}.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCategory("insumos")}
                            className="mt-3 gap-1.5 text-xs rounded-xl border-[#d5cdc4] text-[#4a3e39]"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Cargar Insumos
                          </Button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {(totalInsumosAmount > 0 || insumosList.some((i) => i.amount > 0)) && (
                    <tfoot>
                      <tr className="border-t-2 border-[#e8e2d9] bg-[#faf8f5]/60 font-semibold text-xs text-[#2b2623]">
                        <td className="py-3.5 text-left font-bold text-sm text-primary">
                          Total Insumos
                        </td>
                        <td className="py-3.5 text-right font-bold text-sm text-primary pr-4 whitespace-nowrap">
                          {formatCurrency(totalInsumosAmount)}
                        </td>
                        <td className="py-3.5 text-right text-sm font-bold text-primary pr-4 whitespace-nowrap">
                          ${formatDecimal(totalInsumosCostoPorHa, 2)}{" "}
                          <span className="text-xs font-normal text-[#8f827a]">USD/Ha</span>
                        </td>
                        <td className="py-3.5 text-right text-sm font-bold text-primary pr-4 whitespace-nowrap">
                          ${formatDecimal(totalInsumosCostoPorKg, 2)}{" "}
                          <span className="text-xs font-normal text-[#8f827a]">USD/Kg</span>
                        </td>
                        <td className="py-3.5 pr-2"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: EVOLUCIÓN HISTÓRICA                               */}
      {/* ========================================================= */}
      {activeTab === "historico" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Card Gráfico de Barras con Filtros */}
          <div className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-xs">
            {/* Toolbar superior del gráfico */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
              <h2 className="text-base md:text-lg font-bold text-primary">
                Evolución de Costos Operativos Totales Anuales
              </h2>

              <div className="flex flex-wrap items-center gap-3">
                {/* Dropdown Filtro por Rubros */}
                <div className="relative">
                  <select
                    value={selectedHistoricalRubro}
                    onChange={(e) => setSelectedHistoricalRubro(e.target.value)}
                    className="appearance-none bg-white border border-stone-200 text-[#4a3e39] text-xs font-medium rounded-xl px-3 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs cursor-pointer"
                  >
                    <option value="all">Todos los rubros</option>
                    {Object.entries(CATEGORIES_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Filtro de Años (Pill Group) */}
                <div className="inline-flex items-center rounded-xl border border-stone-200 p-0.5 bg-stone-50/60 text-xs shadow-2xs">
                  <button
                    onClick={() => setTimeRangeFilter("all")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-medium transition-all",
                      timeRangeFilter === "all"
                        ? "bg-white text-[#4a3e39] shadow-2xs font-semibold"
                        : "text-stone-500 hover:text-stone-800"
                    )}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setTimeRangeFilter("last3")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-medium transition-all",
                      timeRangeFilter === "last3"
                        ? "bg-white text-[#4a3e39] shadow-2xs font-semibold"
                        : "text-stone-500 hover:text-stone-800"
                    )}
                  >
                    Últimos 3 años
                  </button>
                  <button
                    onClick={() => setTimeRangeFilter("last5")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-medium transition-all",
                      timeRangeFilter === "last5"
                        ? "bg-white text-[#4a3e39] shadow-2xs font-semibold"
                        : "text-stone-500 hover:text-stone-800"
                    )}
                  >
                    Últimos 5 años
                  </button>
                  <button
                    onClick={() => {
                      setModalRadioOption(
                        timeRangeFilter === "custom"
                          ? "custom"
                          : timeRangeFilter === "last3"
                            ? "last3"
                            : "last5"
                      );
                      setIntervalModalOpen(true);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-medium transition-all",
                      timeRangeFilter === "custom"
                        ? "bg-white text-[#4a3e39] shadow-2xs font-semibold"
                        : "text-stone-500 hover:text-stone-800"
                    )}
                  >
                    Personalizado
                  </button>
                </div>

                {/* Switch Mostrar Costo / Kg */}
                <div className="flex items-center gap-2 pl-1">
                  <Switch
                    checked={mostrarCostoKg}
                    onCheckedChange={setMostrarCostoKg}
                    className="data-[state=checked]:bg-[#4a3e39]"
                  />
                  <span className="text-xs font-medium text-[#4a3e39]">
                    Mostrar Costo / Kg
                  </span>
                </div>
              </div>
            </div>

            {/* Gráfico Composed (Barras de Costo Total + Línea de Costo por Kilo) */}
            <div className="w-full h-[380px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={historicalChartData}
                  margin={{ top: 20, right: mostrarCostoKg ? 35 : 15, left: 15, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eae5dd" />
                  <XAxis
                    dataKey="year"
                    axisLine={{ stroke: "#d5cdc4" }}
                    tickLine={false}
                    tick={{ fill: "#8c7b70", fontSize: 11 }}
                    dy={8}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={{ stroke: "#d5cdc4" }}
                    tickLine={false}
                    tick={{ fill: "#8c7b70", fontSize: 11 }}
                    tickFormatter={(val) => {
                      if (val === 0) return "$0";
                      return `$${val.toLocaleString("es-AR")}`;
                    }}
                  />
                  {mostrarCostoKg && (
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={{ stroke: "#d5cdc4" }}
                      tickLine={false}
                      tick={{ fill: "#8c7b70", fontSize: 11 }}
                      tickFormatter={(val) => `$${val.toFixed(2)}`}
                      unit=" USD/Kg"
                      dx={8}
                    />
                  )}
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      if (name === "Costo Total") {
                        return [formatCurrency(Number(value)), name];
                      }
                      return [`$${Number(value).toFixed(2)} USD/Kg`, name];
                    }}
                    labelFormatter={(label) => `Año: ${label}`}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #ede8e1",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="costTotal"
                    name="Costo Total"
                    fill="#54443e"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={44}
                  />
                  {mostrarCostoKg && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="costoKilo"
                      name="Costo por Kilo"
                      stroke="#e07340"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#e07340", stroke: "#ffffff", strokeWidth: 1.5 }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Leyenda personalizada al pie del gráfico (como Screenshot 2) */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-2 text-xs font-medium text-stone-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#54443e] rounded-xs inline-block"></span>
                <span>Costo Total</span>
              </div>
              {mostrarCostoKg && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center text-[#e07340]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e07340] inline-block border-2 border-white shadow-2xs"></span>
                    <span className="w-4 h-0.5 bg-[#e07340] inline-block -ml-0.5"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e07340] inline-block -ml-0.5 border-2 border-white shadow-2xs"></span>
                  </span>
                  <span>Costo por Kilo</span>
                </div>
              )}
            </div>
          </div>

          {/* --- TABLA EVOLUCIÓN (TAL CUAL LA QUE YA ESTABA) --- */}
          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-foreground">Evolución de Costos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1">
              <div className="relative w-full max-w-full overflow-x-auto border-none pb-1">
                <table className="w-full min-w-max border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted">
                      <th className="sticky left-0 z-[5] bg-muted p-3 text-left font-semibold text-muted-foreground shadow-[1px_0_0_0_hsl(var(--border))]">
                        Categoría
                      </th>
                      {displayedYears.map((year, index) => {
                        const isHistorical = year < currentYear;
                        const isCurrentYear = year === currentYear;
                        const nextYear = displayedYears[index + 1];
                        return (
                          <th
                            key={year}
                            className={cn(
                              "text-center p-3 font-semibold relative min-w-[100px]",
                              isHistorical && "bg-slate-50/50",
                              isCurrentYear && "border-r-2 border-yellow-500"
                            )}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-muted-foreground">{year}</span>
                            </div>
                            {isCurrentYear && nextYear && (
                              <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-yellow-500"></div>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(categoriaLabels).map(([categoryKey, categoryName]) => (
                      <tr key={categoryKey} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="sticky left-0 z-[5] bg-card p-3 shadow-[1px_0_0_0_hsl(var(--border))]">
                          <Badge
                            style={{
                              backgroundColor: categoriaColors[categoryKey] || "#cccccc",
                              color: "white",
                            }}
                            className="whitespace-nowrap"
                          >
                            {categoryName}
                          </Badge>
                        </td>
                        {displayedYears.map((year) => {
                          const amount = getCostForCategoryAndYear(categoryKey, year);
                          const isHistorical = year < currentYear;

                          return (
                            <td
                              key={year}
                              className={cn(
                                "text-center p-3",
                                amount === 0 ? "text-muted-foreground/30" : "font-semibold text-foreground",
                                isHistorical && "bg-slate-50/20"
                              )}
                            >
                              ${amount.toLocaleString()}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-primary/5 font-medium">
                      <td className="sticky left-0 z-[5] bg-background p-3 shadow-[1px_0_0_0_hsl(var(--border))]">
                        <div className="font-semibold text-foreground">Total U$D</div>
                      </td>
                      {displayedYears.map((year) => {
                        const total = Object.keys(categoriaLabels).reduce(
                          (sum, category) => sum + getCostForCategoryAndYear(category, year),
                          0
                        );
                        const isHistorical = year < currentYear;

                        return (
                          <td
                            key={year}
                            className={cn(
                              "text-center p-3 font-bold text-foreground",
                              isHistorical && "bg-slate-50/20"
                            )}
                          >
                            ${total.toLocaleString()}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: COMPARACIONES                                      */}
      {/* ========================================================= */}
      {activeTab === "comparaciones" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Contenido de comparaciones (vacío por el momento) */}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: INTERVALO DE AÑOS (Screenshot 3)                  */}
      {/* ========================================================= */}
      <Dialog open={intervalModalOpen} onOpenChange={setIntervalModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6 sm:p-7 border-none shadow-xl">
          <DialogHeader className="flex flex-row items-center justify-between pb-2">
            <DialogTitle className="text-xl font-bold text-[#2b2623]">
              Intervalo de años
            </DialogTitle>
          </DialogHeader>

          {/* Subtabs del modal: Filtrar | Comparar */}
          <div className="flex border-b border-[#e5dfd7] text-sm font-semibold mb-6">
            <button
              onClick={() => setModalTab("filtrar")}
              className={cn(
                "pb-2 px-2 transition-all cursor-pointer",
                modalTab === "filtrar"
                  ? "border-b-2 border-[#54443e] text-[#54443e]"
                  : "text-stone-400 hover:text-stone-600"
              )}
            >
              Filtrar
            </button>
            <button
              onClick={() => setModalTab("comparar")}
              className={cn(
                "pb-2 px-4 transition-all cursor-pointer",
                modalTab === "comparar"
                  ? "border-b-2 border-[#54443e] text-[#54443e]"
                  : "text-stone-400 hover:text-stone-600"
              )}
            >
              Comparar
            </button>
          </div>

          {/* Opciones de Radio */}
          <div className="space-y-4">
            <RadioGroup
              value={modalRadioOption}
              onValueChange={(val: any) => setModalRadioOption(val)}
              className="space-y-3"
            >
              <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-[#2b2623]">
                <RadioGroupItem
                  value="last3"
                  className="border-stone-400 text-[#4a3e39] focus:ring-[#4a3e39]"
                />
                <span>Últimos 3 años</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-[#2b2623]">
                <RadioGroupItem
                  value="last5"
                  className="border-stone-400 text-[#4a3e39] focus:ring-[#4a3e39]"
                />
                <span>Últimos 5 años</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-[#2b2623]">
                <RadioGroupItem
                  value="custom"
                  className="border-stone-400 text-[#4a3e39] focus:ring-[#4a3e39]"
                />
                <span>Personalizado</span>
              </label>
            </RadioGroup>

            {/* Inputs de Año Inicio y Año Fin (visibles al seleccionar Personalizado) */}
            {modalRadioOption === "custom" && (
              <div className="pt-2 pl-7 flex items-center gap-3 animate-in fade-in-50 duration-150">
                <div className="flex-1 relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-[#8f827a]">
                    Año de inicio
                  </label>
                  <select
                    value={customStartYear}
                    onChange={(e) => setCustomStartYear(Number(e.target.value))}
                    className="w-full bg-white border border-[#c8d6e5] text-[#2b2623] text-sm font-medium rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs cursor-pointer"
                  >
                    {allHistoricalYears.map((yr) => (
                      <option key={`start-${yr}`} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <span className="text-[#8f827a] font-semibold text-base">—</span>

                <div className="flex-1 relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-[#8f827a]">
                    Año de finalización
                  </label>
                  <select
                    value={customEndYear}
                    onChange={(e) => setCustomEndYear(Number(e.target.value))}
                    className="w-full bg-white border border-[#c8d6e5] text-[#2b2623] text-sm font-medium rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs cursor-pointer"
                  >
                    {allHistoricalYears.map((yr) => (
                      <option key={`end-${yr}`} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          <hr className="border-t border-[#ede7df] my-6" />

          {/* Botones del footer del modal */}
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={() => setIntervalModalOpen(false)}
              className="text-sm font-semibold text-[#54443e] hover:text-[#2b2623] transition-colors px-3 py-2 cursor-pointer"
            >
              Cancelar
            </button>
            <Button
              onClick={handleApplyIntervalModal}
              className="bg-[#4a3e39] hover:bg-[#3d322d] text-white rounded-full px-7 py-2 font-medium text-sm shadow-xs transition-colors"
            >
              Aplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sheet para agregar y editar costos */}
      <AddCostoSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingCosto(null);
        }}
        onSave={handleUpdateCosto}
        editingCosto={editingCosto}
        existingCosts={costosFiltered}
      />

      {/* Diálogo para confirmar eliminación de costo */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#2b2623]">¿Eliminar este costo?</AlertDialogTitle>
            <AlertDialogDescription className="text-stone-500">
              Se eliminará permanentemente el registro de costo seleccionado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-stone-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Costos;