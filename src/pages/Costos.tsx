import { useState, useMemo, useEffect, useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Pencil, Trash2, Info, Scale, Eye, X, Beaker, Fuel, Users, Zap, Wheat, FileText, Wrench, MoreHorizontal } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, Legend, Tooltip, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ComposedChart, Line } from "recharts";
import AddCostoSheet from "@/components/costos/AddCostoSheet";
import { useDataStore } from "@/stores";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCalculationsStore } from "@/stores/calculationsStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const categoryIcons: Record<string, any> = {
  insumos: Beaker,
  combustible: Fuel,
  "mano-obra": Users,
  energia: Zap,
  cosecha: Wheat,
  "gastos-admin": FileText,
  mantenimientos: Wrench,
  "costos-oportunidad": TrendingUp,
  otros: MoreHorizontal,
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const filteredPayload = payload.filter((item: any) => item.value > 0);
    if (filteredPayload.length === 0) return null;

    return (
      <div style={{
        backgroundColor: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "8px",
        padding: "10px",
        fontSize: "12px"
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{`Año: ${label}`}</p>
        {filteredPayload.map((item: any, index: number) => (
          <p key={index} style={{ color: item.color, margin: '5px 0' }}>
            {`${item.name}: $${item.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Costos = () => {
  const { currentProjectId, campaigns, currentCampaign, costsLoading, montes } = useApp();
  const costs = useDataStore(state => state.costs);
  const addCost = useDataStore(state => state.addCost);
  const updateCost = useDataStore(state => state.updateCost);
  const deleteCost = useDataStore(state => state.deleteCost);
  const { getCostByCategory, getTotalCostsByCampaign, getTotalProductionByCampaign } = useCalculationsStore();
  const loadAllProductions = useDataStore(state => state.loadAllProductions);

  // Filtros de evolución histórica
  const [filterType, setFilterType] = useState<"all" | "3years" | "5years" | "custom">("all");
  const [customStartYear, setCustomStartYear] = useState<number>(0);
  const [customEndYear, setCustomEndYear] = useState<number>(0);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Estados temporales del modal de rango personalizado
  const [tempFilterType, setTempFilterType] = useState<"3years" | "5years" | "custom">("3years");
  const [tempStartYear, setTempStartYear] = useState<number>(0);
  const [tempEndYear, setTempEndYear] = useState<number>(0);

  // Cargar producciones para calcular Kilos Reales Cosechados
  useEffect(() => {
    if (campaigns && campaigns.length > 0) {
      loadAllProductions(campaigns);
    }
  }, [campaigns, loadAllProductions]);

  // Selección segura de la campaña
  const currentCampaignObj = useMemo(() => {
    return campaigns.find((c) => Number(c.year) === Number(currentCampaign));
  }, [campaigns, currentCampaign]);

  // Total usando el store de cálculos
  const totalCostos = currentCampaignObj ? getTotalCostsByCampaign(currentCampaignObj.id) : 0;

  // Total area plantada (acumulada hasta la campaña actual)
  const totalAreaPlantada = montes
    .filter(monte => monte.añoPlantacion <= currentCampaign)
    .reduce((sum, monte) => sum + monte.hectareas, 0);

  // Costo total por hectárea
  const costoPorHectarea = totalAreaPlantada > 0 ? totalCostos / totalAreaPlantada : 0;

  // Kilos Reales Cosechados (total de producción de la campaña actual)
  const totalKilos = currentCampaignObj ? getTotalProductionByCampaign(currentCampaignObj.id) : 0;

  // Costo por Kilo: Total de Gastos Operativos / Kilos Reales Cosechados
  const costoPorKilo = totalKilos > 0 ? totalCostos / totalKilos : 0;

  // Filtrado de lista (Tabla inferior)
  const costosFiltered = useMemo(() => {
    if (!currentCampaignObj) return [];
    return costs.filter((c: any) => String(c.campaign_id) === String(currentCampaignObj.id));
  }, [costs, currentCampaignObj]);

  // Agrupar costos por categoría
  const costosGrouped = useMemo(() => {
    const groups: Record<string, { category: string; total_amount: number; costs: any[] }> = {};

    costosFiltered.forEach((costo: any) => {
      if (!groups[costo.category]) {
        groups[costo.category] = {
          category: costo.category,
          total_amount: 0,
          costs: []
        };
      }
      groups[costo.category].total_amount += Number(costo.total_amount);
      groups[costo.category].costs.push(costo);
    });

    return Object.values(groups);
  }, [costosFiltered]);

  // Desglose de costos por categoría para la campaña seleccionada
  const categoriesBreakdown = useMemo(() => {
    const currentCostsByCategory = currentCampaignObj ? getCostByCategory(currentCampaignObj.id) : {};
    const data = Object.entries(categoriaLabels).map(([key, label]) => {
      const amount = currentCostsByCategory[key] || 0;
      const percentage = totalCostos > 0 ? (amount / totalCostos) * 100 : 0;
      return {
        key,
        name: label,
        value: amount,
        percentage: percentage,
        color: categoriaColors[key] || "#cccccc"
      };
    });
    // Ordenar de mayor a menor por monto (value)
    return data.sort((a, b) => b.value - a.value);
  }, [currentCampaignObj, getCostByCategory, totalCostos, costs]);

  const currentYear = new Date().getFullYear();

  // Datos para el gráfico
  const chartData = useMemo(() => {
    if (campaigns.length === 0) return [];

    return campaigns
      .sort((a, b) => Number(a.year) - Number(b.year))
      .map((campaign) => {
        const year = Number(campaign.year);
        const costsByCategory = getCostByCategory(campaign.id);
        const totalCost = selectedCategory === "all"
          ? Object.values(costsByCategory).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0)
          : Number(costsByCategory[selectedCategory]) || 0;

        // Calcular kilos reales cosechados para esta campaña
        const totalKilos = getTotalProductionByCampaign(campaign.id);
        const costoPorKilo = totalKilos > 0 ? totalCost / totalKilos : 0;

        return {
          year,
          totalCost,
          costoPorKilo,
        };
      });
  }, [campaigns, getCostByCategory, costs, selectedCategory, getTotalProductionByCampaign]);

  const displayedYears = useMemo(() => {
    if (campaigns.length === 0) return [];
    return campaigns.map(c => Number(c.year)).sort((a, b) => a - b);
  }, [campaigns]);

  // Filtrar los datos del gráfico según la selección
  const filteredChartData = useMemo(() => {
    if (chartData.length === 0) return [];
    let data = [...chartData];
    if (filterType === "3years") {
      data = data.slice(-3);
    } else if (filterType === "5years") {
      data = data.slice(-5);
    } else if (filterType === "custom") {
      data = data.filter(d => d.year >= customStartYear && d.year <= customEndYear);
    }
    return data;
  }, [chartData, filterType, customStartYear, customEndYear]);

  // Helper para la tabla de evolución
  const getCostForCategoryAndYear = (category: string, year: number): number => {
    const campaign = campaigns.find((c) => Number(c.year) === year);
    if (!campaign) return 0;
    const costsByCategory = getCostByCategory(campaign.id);
    return costsByCategory[category] || 0;
  };

  const getCostoDescription = (costo: any) => {
    if (costo.details && typeof costo.details === 'object') {
      if (costo.details.type) return costo.details.type;
      if (costo.details.subtype) {
        const subtypeLabels: Record<string, string> = {
          'machinery': 'Tractores',
          'vehicles': 'Vehículos/Rodados',
          'irrigation': 'Riego',
          'other': 'Otros'
        };
        return subtypeLabels[costo.details.subtype] || costo.details.subtype;
      }
    }
    return categoriaLabels[costo.category] || costo.category;
  };

  const [selectedCostForDetail, setSelectedCostForDetail] = useState<any>(null);
  const [showInfoCard, setShowInfoCard] = useState(() => {
    return localStorage.getItem("hide_costos_info_card") !== "true";
  });
  const [showCostoPorKiloLine, setShowCostoPorKiloLine] = useState(true);
  const hasInitializedDetailRef = useRef(false);

  const handleOpenCustomModal = () => {
    setTempFilterType(filterType === "custom" ? "custom" : "3years");
    setTempStartYear(customStartYear || displayedYears[0] || 0);
    setTempEndYear(customEndYear || displayedYears[displayedYears.length - 1] || 0);
    setCustomModalOpen(true);
  };

  // Inicializar rango de años
  useEffect(() => {
    if (displayedYears.length > 0) {
      if (customStartYear === 0) {
        setCustomStartYear(displayedYears[0]);
      }
      if (customEndYear === 0) {
        setCustomEndYear(displayedYears[displayedYears.length - 1]);
      }
    }
  }, [displayedYears, customStartYear, customEndYear]);

  // Clear detail when current campaign changes
  useEffect(() => {
    setSelectedCostForDetail(null);
  }, [currentCampaign]);

  // Load last cost group on first render once costs are loaded
  useEffect(() => {
    if (!costsLoading && costosGrouped.length > 0 && !hasInitializedDetailRef.current) {
      const lastCost = [...costosFiltered].sort((a, b) => b.id - a.id)[0];
      if (lastCost) {
        const lastGroup = costosGrouped.find(g => g.category === lastCost.category);
        if (lastGroup) {
          setSelectedCostForDetail(lastGroup);
          hasInitializedDetailRef.current = true;
        }
      }
    }
  }, [costsLoading, costosFiltered, costosGrouped]);

  const renderCostDetail = (group: any) => {
    const costsList = group.costs || [];
    if (costsList.length === 0) return null;

    return (
      <div className="space-y-6">
        {costsList.map((costo: any, index: number) => {
          const details = costo.details || {};
          const isQuick = !!details.quickMode;

          return (
            <div key={costo.id} className="space-y-4">
              {costsList.length > 1 && (
                <div className="text-sm font-semibold text-primary border-b pb-1">
                  Registro #{index + 1}: {getCostoDescription(costo)}
                </div>
              )}
              {(() => {
                switch (costo.category) {
                  case "insumos": {
                    if (isQuick) {
                      const subtotals = details.subtotals || {};
                      const activeSubtotals = Object.entries(subtotals).filter(([_, val]) => Number(val) > 0);
                      return (
                        <div className="space-y-3">
                          <div className="text-sm font-semibold text-muted-foreground mb-1">Carga Rápida (Subtotales)</div>
                          {activeSubtotals.length > 0 ? (
                            <div className="divide-y divide-border rounded-md border bg-slate-50/50">
                              {activeSubtotals.map(([key, val]) => {
                                const label = {
                                  "fertilizantes-suelo": "Fertilizantes al suelo",
                                  "fertilizantes-foliares": "Fertilizantes foliares",
                                  "fungicidas": "Fungicidas",
                                  "herbicidas": "Herbicidas",
                                  "insecticidas": "Insecticidas",
                                  "otros": "Otros"
                                }[key] || key;
                                return (
                                  <div key={key} className="flex justify-between p-2.5 text-sm">
                                    <span className="font-medium text-foreground">{label}</span>
                                    <span className="font-semibold text-right">${Number(val).toLocaleString()}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No hay subtotales registrados.</p>
                          )}
                        </div>
                      );
                    } else {
                      const items = details.items || [];
                      return (
                        <div className="space-y-4">
                          <div className="text-sm font-semibold text-muted-foreground mb-1">Insumo: {details.type}</div>
                          {items.length > 0 ? (
                            <div className="space-y-3">
                              {items.map((item: any, idx: number) => (
                                <div key={item.id || idx} className="p-3 border rounded-lg bg-slate-50/50 space-y-2">
                                  <div className="flex justify-between font-semibold text-sm">
                                    <span className="text-foreground">{item.product}</span>
                                    <span className="text-foreground">${Number(item.cost).toLocaleString()}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                    <div>Precio unitario: ${Number(item.unit_price).toLocaleString()}</div>
                                    {item.quantity_used !== undefined ? (
                                      <div>Cantidad usada: {item.quantity_used} kg/L</div>
                                    ) : (
                                      <>
                                        <div>Dosis: {item.application_dose_ml} ml/ha</div>
                                        <div>Volumen: {item.application_volume_l} L/ha</div>
                                        <div className="col-span-2">Aplicaciones: {item.application_count}</div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No hay productos registrados en este detalle.</p>
                          )}
                        </div>
                      );
                    }
                  }

                  case "combustible": {
                    if (isQuick) {
                      return (
                        <div className="p-3 border rounded-lg bg-slate-50/50 flex justify-between items-center text-sm">
                          <span className="font-medium text-muted-foreground">Carga rápida</span>
                          <span className="font-bold text-foreground">${Number(costo.total_amount).toLocaleString()}</span>
                        </div>
                      );
                    } else {
                      const fuelData = details.data || {};
                      const breakdown = details.breakdown || {};
                      return (
                        <div className="space-y-4">
                          <div className="text-sm font-semibold text-muted-foreground mb-1">Combustible: {details.type}</div>

                          {details.type === "Tractores" && (
                            <div className="space-y-3">
                              <div className="p-3 border rounded-lg bg-slate-50/50 space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Litros estimados:</span>
                                  <span className="font-semibold text-foreground">{Number(fuelData.fuel_liters).toLocaleString()} L</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Precio por litro:</span>
                                  <span className="font-semibold text-foreground">${Number(fuelData.fuel_price).toLocaleString()}</span>
                                </div>
                                <div className="border-t border-dashed my-2 pt-2 flex justify-between font-semibold">
                                  <span>Total combustible:</span>
                                  <span>${Number(breakdown.total_fuel_cost).toLocaleString()}</span>
                                </div>
                              </div>
                              {fuelData.machinery_list && fuelData.machinery_list.length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-xs font-semibold text-muted-foreground">Horas y Consumo de Maquinaria</div>
                                  <div className="space-y-1.5">
                                    {fuelData.machinery_list.map((m: any, idx: number) => (
                                      <div key={idx} className="p-2 border rounded bg-white text-xs space-y-1">
                                        <div className="font-semibold text-foreground">{m.name}</div>
                                        <div className="flex justify-between text-muted-foreground">
                                          <span>Horas: {m.hours_used} h | Consumo: {m.consumption_rate} L/h</span>
                                          <span className="font-semibold text-foreground">{(m.hours_used * m.consumption_rate).toFixed(1)} L</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {details.type === "Vehículos/Rodados" && (
                            <div className="space-y-3">
                              <div className="p-3 border rounded-lg bg-slate-50/50 space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Litros:</span>
                                  <span className="font-semibold text-foreground">{Number(fuelData.fuel_liters).toLocaleString()} L</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Precio por litro:</span>
                                  <span className="font-semibold text-foreground">${Number(fuelData.fuel_price).toLocaleString()}</span>
                                </div>
                              </div>
                              {fuelData.fleet_list && fuelData.fleet_list.length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-xs font-semibold text-muted-foreground">Flota de Vehículos</div>
                                  <div className="space-y-1.5">
                                    {fuelData.fleet_list.map((v: any, idx: number) => (
                                      <div key={idx} className="flex justify-between p-2 border rounded bg-white text-xs">
                                        <span className="font-medium text-foreground">{v.name}</span>
                                        <span className="text-muted-foreground">Valor: ${Number(v.value).toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {(details.type === "Riego" || details.type === "Otros") && (
                            <div className="p-3 border rounded-lg bg-slate-50/50 space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Litros:</span>
                                <span className="font-semibold text-foreground">{Number(fuelData.fuel_liters).toLocaleString()} L</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Precio por litro:</span>
                                <span className="font-semibold text-foreground">${Number(fuelData.fuel_price).toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                  }

                  case "mano-obra": {
                    if (isQuick) {
                      return (
                        <div className="p-3 border rounded-lg bg-slate-50/50 flex justify-between items-center text-sm">
                          <span className="font-medium text-muted-foreground">Carga rápida</span>
                          <span className="font-bold text-foreground">${Number(costo.total_amount).toLocaleString()}</span>
                        </div>
                      );
                    } else {
                      const staffList = details.data?.staff_list || [];
                      const breakdown = details.breakdown || {};
                      return (
                        <div className="space-y-4">
                          <div className="text-sm font-semibold text-muted-foreground mb-1">Mano de Obra: {details.type}</div>
                          <div className="p-3 border rounded-lg bg-slate-50/50 space-y-1.5 text-xs text-muted-foreground">
                            <div className="flex justify-between text-sm text-foreground font-semibold">
                              <span>Total Anual:</span>
                              <span>${Number(breakdown.total_annual_gross).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Planilla Mensual:</span>
                              <span>${Number(breakdown.total_monthly_payroll).toLocaleString()}</span>
                            </div>
                          </div>
                          {staffList.length > 0 ? (
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-muted-foreground">Personal Registrado</div>
                              {staffList.map((s: any, idx: number) => {
                                const monthlyCost = s.salary_base * (1 + s.social_tax_pct / 100) * s.people_count;
                                return (
                                  <div key={idx} className="p-2.5 border rounded bg-white text-xs space-y-1">
                                    <div className="flex justify-between font-semibold text-foreground">
                                      <span>{s.role} ({s.people_count})</span>
                                      <span>${monthlyCost.toLocaleString()}/mes</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                      <span>Sueldo Base: ${Number(s.salary_base).toLocaleString()}</span>
                                      <span>Cargas Sociales: {s.social_tax_pct}%</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No hay personal registrado.</p>
                          )}
                        </div>
                      );
                    }
                  }

                  case "energia": {
                    if (isQuick) {
                      return (
                        <div className="p-3 border rounded-lg bg-slate-50/50 flex justify-between items-center text-sm">
                          <span className="font-medium text-muted-foreground">Carga rápida</span>
                          <span className="font-bold text-foreground">${Number(costo.total_amount).toLocaleString()}</span>
                        </div>
                      );
                    } else {
                      const subtotalAnual = details.data?.subtotalAnual || 0;
                      return (
                        <div className="space-y-3">
                          <div className="text-sm font-semibold text-muted-foreground mb-1">Energía: {details.type}</div>
                          <div className="p-3 border rounded-lg bg-slate-50/50 flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal Anual:</span>
                            <span className="font-bold text-foreground">${Number(subtotalAnual).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    }
                  }

                  case "cosecha": {
                    const data = details.data || {};
                    const valores = data.valores || {};
                    const activeValores = Object.entries(valores).filter(([_, val]) => Number(val) > 0);
                    const labels: Record<string, string> = {
                      cosecha_maquinaria: "Cosecha maquinaria",
                      cosecha_mano_obra: "Cosecha mano de obra",
                      limpieza_maquinaria: "Limpieza maquinaria",
                      limpieza_mano_obra: "Limpieza mano de obra",
                      cosecha_tercerizada: "Cosecha tercerizada",
                      secado_clasificacion: "Secado, clasificación y almacén",
                      transporte: "Transporte nacional e internacional",
                    };
                    return (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-muted-foreground mb-1">Desglose de Cosecha</div>
                        {activeValores.length > 0 ? (
                          <div className="divide-y divide-border rounded-md border bg-slate-50/50">
                            {activeValores.map(([key, val]) => (
                              <div key={key} className="flex justify-between p-2.5 text-sm">
                                <span className="font-medium text-foreground">{labels[key] || key}</span>
                                <span className="font-semibold text-right">${Number(val).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No hay costos de cosecha registrados.</p>
                        )}
                      </div>
                    );
                  }

                  case "gastos-admin": {
                    if (isQuick) {
                      return (
                        <div className="p-3 border rounded-lg bg-slate-50/50 flex justify-between items-center text-sm">
                          <span className="font-medium text-muted-foreground">Carga rápida</span>
                          <span className="font-bold text-foreground">${Number(costo.total_amount).toLocaleString()}</span>
                        </div>
                      );
                    } else {
                      const data = details.data || {};
                      const isGenerales = details.type === "Gastos Generales";
                      return (
                        <div className="space-y-4">
                          <div className="text-sm font-semibold text-muted-foreground mb-1">Gastos de Administración: {details.type}</div>
                          {isGenerales ? (
                            <div className="space-y-2">
                              {(data.items || []).map((item: any, idx: number) => (
                                <div key={item.id || idx} className="flex justify-between p-2.5 border rounded bg-slate-50/50 text-xs">
                                  <span className="font-medium text-foreground">{item.tipo}</span>
                                  <span className="font-bold text-foreground">${Number(item.monto).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {(data.staff || []).map((item: any, idx: number) => {
                                const totalRemun = item.remuneracion * (1 + item.cargasSociales / 100) * item.nroProfesionales;
                                return (
                                  <div key={item.id || idx} className="p-2.5 border rounded bg-slate-50/50 text-xs space-y-1">
                                    <div className="flex justify-between font-semibold text-foreground">
                                      <span>{item.rol} ({item.nroProfesionales})</span>
                                      <span>${totalRemun.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                      <span>Remuneración: ${Number(item.remuneracion).toLocaleString()}</span>
                                      <span>Cargas Sociales: {item.cargasSociales}%</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                  }

                  case "mantenimientos": {
                    const items = details.items || [];
                    return (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-muted-foreground mb-1">Herramientas y Reparaciones</div>
                        {items.length > 0 ? (
                          <div className="divide-y divide-border rounded-md border bg-slate-50/50">
                            {items.map((item: any, idx: number) => (
                              <div key={item.id || idx} className="flex justify-between p-2.5 text-sm">
                                <span className="font-medium text-foreground">{item.nombreHerramienta}</span>
                                <span className="font-semibold text-right">${Number(item.precioReparacion).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No hay herramientas registradas.</p>
                        )}
                      </div>
                    );
                  }

                  case "costos-oportunidad": {
                    return (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-muted-foreground mb-1">Detalle de Costo de Oportunidad</div>
                        <div className="p-3 border rounded-lg bg-slate-50/50 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tipo:</span>
                            <span className="font-semibold text-foreground">{details.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cantidad / Hectáreas:</span>
                            <span className="font-semibold text-foreground">{details.cantidad}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Precio por Unidad:</span>
                            <span className="font-semibold text-foreground">${Number(details.precioUnidad).toLocaleString()}</span>
                          </div>
                          <div className="border-t border-dashed my-2 pt-2 flex justify-between font-bold">
                            <span>Total:</span>
                            <span>${Number(details.total).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  case "otros": {
                    const items = details.items || [];
                    return (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-muted-foreground mb-1">Conceptos Adicionales</div>
                        {items.length > 0 ? (
                          <div className="divide-y divide-border rounded-md border bg-slate-50/50">
                            {items.map((item: any, idx: number) => (
                              <div key={item.id || idx} className="flex justify-between p-2.5 text-sm">
                                <span className="font-medium text-foreground">{item.concepto}</span>
                                <span className="font-semibold text-right">${Number(item.monto).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No hay conceptos registrados.</p>
                        )}
                      </div>
                    );
                  }

                  default:
                    return <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(details, null, 2)}</pre>;
                }
              })()}
            </div>
          );
        })}
      </div>
    );
  };

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCosto, setEditingCosto] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<any>(null);

  const handleDeleteCostoGroup = (group: any) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (groupToDelete) {
      try {
        await Promise.all(groupToDelete.costs.map((costo: any) => deleteCost(costo.id)));
        toast.success("Categoría eliminada correctamente");
        if (selectedCostForDetail?.category === groupToDelete.category) {
          setSelectedCostForDetail(null);
        }
      } catch (error) {
        toast.error("Error al eliminar los costos de la categoría");
        console.error("Error deleting cost group:", error);
      }
    }
    setDeleteDialogOpen(false);
    setGroupToDelete(null);
  };

  const handleEditCostoGroup = (group: any) => {
    setEditingCosto(group.costs[0]);
    setSheetOpen(true);
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
      if (typeof categoriaOrData === 'object' && categoriaOrData.category) {
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
      }
      else if (typeof formData === 'object' && formData.category) {
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
      }
      else if (editingCosto) {
        const categoria = categoriaOrData as string;
        await updateCost(editingCosto.id, {
          category: categoria,
          details: formData,
          total_amount: formData?.total || formData?.total_amount || 0,
        });
        toast.success("Costo actualizado");
        setEditingCosto(null);
      }
      else {
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
      setSelectedCostForDetail(null);
    } catch (error) {
      toast.error("Error al guardar el costo");
      console.error("Error saving cost:", error);
    }
  };



  if (costsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Cargando costos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl mb-2">Costos Operativos</h1>
        </div>
        <Button
          onClick={() => setSheetOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Plus className="h-5 w-5" />
          Nuevo Costo
        </Button>
      </div>

      {showInfoCard && (
        <Card className="relative bg-amber-50 border-amber-200 mb-6">
          <CardContent className="flex items-start gap-4 p-4 pr-10">
            <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium font-semibold text-amber-900">
                Al registrar tus costos recuerda:
              </p>
              <p className="text-sm text-amber-800/90 leading-relaxed">
                Los datos que ingreses deben ser <strong>montos anuales</strong> que tuviste en los meses
                que duro la campaña en cada uno de los rubros.
                <br />
                <span className="italic mt-1 block">Nota: Si compraste maquinaria, instalaste riego o realizaste mejoras permanentes, se registran en la sección de <strong>Inversiones</strong>.</span>
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.setItem("hide_costos_info_card", "true");
                setShowInfoCard(false);
              }}
              className="absolute top-3 right-3 text-amber-600 hover:text-amber-800 hover:bg-amber-100/60 p-1 rounded-full transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="resumen" className="w-full space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="resumen">Resumen de campaña {currentCampaign}</TabsTrigger>
          <TabsTrigger value="historica">Evolución histórica</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LADO IZQUIERDO: Gráfico circular y barras de progreso */}
            <Card className="lg:col-span-2 border-border/50 shadow-md bg-white">
              <CardHeader>
                <CardTitle className="text-foreground">Desglose de Costos {currentCampaign}</CardTitle>
              </CardHeader>
              <CardContent>
                {totalCostos > 0 ? (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    {/* Barras de progreso */}
                    <div className="w-full md:w-1/2 space-y-3.5">
                      {categoriesBreakdown.map((item) => (
                        <div key={item.key} className="space-y-1">
                          <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-muted-foreground">{item.name}</span>
                            <span className="text-foreground font-semibold">{item.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${item.percentage}%`,
                                backgroundColor: item.color
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Gráfico circular / Donut */}
                    <div className="w-full md:w-1/2 flex justify-center">
                      <div className="relative flex justify-center items-center shrink-0 w-[300px] h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoriesBreakdown.filter(item => item.value > 0)}
                              cx="50%"
                              cy="50%"
                              innerRadius={85}
                              outerRadius={115}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {categoriesBreakdown.filter(item => item.value > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Monto"]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                          <span className="text-3xl font-extrabold text-foreground">100%</span>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Desglose</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[240px] flex items-center justify-center text-muted-foreground">
                    Sin costos registrados para esta campaña
                  </div>
                )}
              </CardContent>
            </Card>

            {/* LADO DERECHO: Tarjetas apiladas verticalmente */}
            <div className="flex flex-col gap-6 justify-between">
              {/* Card 1: Total Costos Operativos */}
              <Card className="border-border/50 shadow-md bg-white flex-1 flex flex-col justify-center min-h-[100px]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-warning/10">
                      <TrendingUp className="h-8 w-8 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Costos Operativos</p>
                      <p className="text-3xl font-bold text-foreground">${totalCostos.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Costo por Hectárea */}
              <Card className="border-border/50 shadow-md bg-white flex-1 flex flex-col justify-center min-h-[100px]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-500/10">
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Costo Total por ha</p>
                      <p className="text-3xl font-bold text-foreground">
                        ${costoPorHectarea.toLocaleString()}{" "}
                        <span className="text-base font-normal text-muted-foreground">USD/Ha</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Costo por Kilo */}
              <Card className="border-border/50 shadow-md bg-white flex-1 flex flex-col justify-center min-h-[100px]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-emerald-500/10">
                      <Scale className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Costo por Kilo</p>
                      <p className="text-3xl font-bold text-foreground">
                        ${costoPorKilo.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                        <span className="text-base font-normal text-muted-foreground">USD/Kg</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Registro de costos (Debajo del grid) */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <Card className={cn("border-border/50 shadow-md transition-all w-full", selectedCostForDetail ? "lg:w-2/3" : "w-full")}>
              <CardHeader>
                <CardTitle className="text-foreground">Detalle de Costos campaña {currentCampaign}</CardTitle>
              </CardHeader>
              <CardContent>
                {costosGrouped.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Rubro/Categoría</th>
                          <th className="text-right p-3 text-sm font-semibold text-muted-foreground">Total</th>
                          <th className="text-center p-3 text-sm font-semibold text-muted-foreground">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costosGrouped.map((group: any) => (
                          <tr key={group.category} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                            <td className="p-3 text-sm">
                              <div className="flex items-center gap-2.5">
                                {(() => {
                                  const IconComponent = categoryIcons[group.category] || MoreHorizontal;
                                  return (
                                    <IconComponent
                                      className="h-5 w-5 shrink-0"
                                      style={{ color: categoriaColors[group.category] || "#64748b" }}
                                    />
                                  );
                                })()}
                                <span className="font-semibold text-foreground">
                                  {categoriaLabels[group.category] || group.category}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-sm text-right font-semibold text-foreground">
                              ${Number(group.total_amount).toLocaleString()}
                            </td>
                            <td className="p-3 text-sm text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "h-8 w-8 text-muted-foreground hover:text-primary",
                                    selectedCostForDetail?.category === group.category && "text-primary bg-primary/10"
                                  )}
                                  onClick={() => {
                                    if (selectedCostForDetail?.category === group.category) {
                                      setSelectedCostForDetail(null);
                                    } else {
                                      setSelectedCostForDetail(group);
                                    }
                                  }}
                                  title="Ver detalle"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={() => handleEditCostoGroup(group)}
                                  title="Editar costos de la categoría"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteCostoGroup(group)}
                                  title="Eliminar costos de la categoría"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No hay costos registrados para la campaña {currentCampaign}.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedCostForDetail && (
              <Card className="border-border/50 shadow-md bg-white w-full lg:w-1/3 shrink-0 flex flex-col justify-between h-fit min-h-[300px]">
                <div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/50">
                    <div className="flex flex-col">
                      <CardTitle className="text-foreground text-base font-semibold">
                        {categoriaLabels[selectedCostForDetail.category] || selectedCostForDetail.category} - Campaña {currentCampaign}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
                      onClick={() => setSelectedCostForDetail(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {renderCostDetail(selectedCostForDetail)}
                  </CardContent>
                </div>
                <div className="p-6 pt-4 mt-auto border-t border-border bg-slate-50/50 rounded-b-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-muted-foreground">Monto Total:</span>
                    <span className="text-2xl font-bold text-foreground">
                      ${Number(selectedCostForDetail.total_amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="historica" className="space-y-6">
          {/* Evolución de costos por año */}
          <Card className="border-border/50 shadow-md">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-foreground">
                  {selectedCategory === "all"
                    ? "Evolución de Costos Operativos Totales Anuales"
                    : `Evolución de Costos Anuales: ${categoriaLabels[selectedCategory]}`}
                </CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {/* Selector de Categoría/Rubro */}
                <div className="w-[180px]">
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="h-9 text-xs bg-white">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">Todos los rubros</SelectItem>
                      {Object.entries(categoriaLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Botones de filtro rápido */}
                <div className="flex items-center border rounded-md p-0.5 bg-slate-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-3 text-xs",
                      filterType === "all" ? "bg-white shadow-sm font-semibold text-foreground" : "text-muted-foreground"
                    )}
                    onClick={() => setFilterType("all")}
                  >
                    Todos
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-3 text-xs",
                      filterType === "3years" ? "bg-white shadow-sm font-semibold text-foreground" : "text-muted-foreground"
                    )}
                    onClick={() => setFilterType("3years")}
                  >
                    Últimos 3 años
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-3 text-xs",
                      filterType === "5years" ? "bg-white shadow-sm font-semibold text-foreground" : "text-muted-foreground"
                    )}
                    onClick={() => setFilterType("5years")}
                  >
                    Últimos 5 años
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-3 text-xs",
                      filterType === "custom" ? "bg-white shadow-sm font-semibold text-foreground" : "text-muted-foreground"
                    )}
                    onClick={handleOpenCustomModal}
                  >
                    Personalizado {filterType === "custom" && `(${customStartYear}-${customEndYear})`}
                  </Button>
                </div>

                <div className="flex items-center space-x-2 border-l pl-4">
                  <Switch
                    id="show-costo-kg"
                    checked={showCostoPorKiloLine}
                    onCheckedChange={setShowCostoPorKiloLine}
                  />
                  <Label htmlFor="show-costo-kg" className="text-sm font-medium cursor-pointer whitespace-nowrap">
                    Mostrar Costo / Kg
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={filteredChartData} margin={{ top: 20, right: 40, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                      label={{ value: "USD / Kg", angle: 90, position: "insideRight", style: { fill: "hsl(var(--muted-foreground))", fontSize: "12px", textAnchor: "middle" } }}
                      tickFormatter={(value) => `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    />
                    <Tooltip content={CustomTooltip} />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar
                      yAxisId="left"
                      dataKey="totalCost"
                      fill={selectedCategory === "all" ? "hsl(var(--primary))" : (categoriaColors[selectedCategory] || "#cccccc")}
                      radius={[4, 4, 0, 0]}
                      name={selectedCategory === "all" ? "Costo Total" : `Costo: ${categoriaLabels[selectedCategory]}`}
                    />
                    {showCostoPorKiloLine && (
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="costoPorKilo"
                        stroke="#f2794a"
                        strokeWidth={3}
                        dot={{ fill: "#f2794a", r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Costo por Kilo"
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  Sin datos para mostrar
                </div>
              )}
            </CardContent>
          </Card>

          {/* --- TABLA EVOLUCIÓN --- */}
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
        </TabsContent>
      </Tabs>

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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar costos de esta categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán permanentemente todos los registros asociados a esta categoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={customModalOpen} onOpenChange={setCustomModalOpen}>
        <DialogContent className="max-w-[420px] p-6 rounded-xl bg-white border border-border shadow-lg">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-semibold text-foreground">Intervalo de años</DialogTitle>
          </DialogHeader>

          {/* Custom Tabs (Visual) */}
          <div className="flex border-b border-border text-sm mb-4">
            <button className="px-4 py-2 font-semibold text-primary border-b-2 border-primary -mb-[2px]">
              Filtrar
            </button>
            <button className="px-4 py-2 font-medium text-muted-foreground cursor-not-allowed" disabled>
              Comparar
            </button>
          </div>

          {/* Options */}
          <div className="space-y-4 py-2">
            {/* Option 3 years */}
            <label className="flex items-center space-x-3 cursor-pointer py-1 group">
              <input
                type="radio"
                name="modalFilterType"
                checked={tempFilterType === "3years"}
                onChange={() => setTempFilterType("3years")}
                className="h-4 w-4 accent-primary border-border focus:ring-primary focus:ring-2"
              />
              <span className="text-sm font-medium text-foreground group-hover:text-foreground/80">
                Últimos 3 años
              </span>
            </label>

            {/* Option 5 years */}
            <label className="flex items-center space-x-3 cursor-pointer py-1 group">
              <input
                type="radio"
                name="modalFilterType"
                checked={tempFilterType === "5years"}
                onChange={() => setTempFilterType("5years")}
                className="h-4 w-4 accent-primary border-border focus:ring-primary focus:ring-2"
              />
              <span className="text-sm font-medium text-foreground group-hover:text-foreground/80">
                Últimos 5 años
              </span>
            </label>

            {/* Option custom */}
            <label className="flex items-center space-x-3 cursor-pointer py-1 group">
              <input
                type="radio"
                name="modalFilterType"
                checked={tempFilterType === "custom"}
                onChange={() => setTempFilterType("custom")}
                className="h-4 w-4 accent-primary border-border focus:ring-primary focus:ring-2"
              />
              <span className="text-sm font-medium text-foreground group-hover:text-foreground/80">
                Personalizado
              </span>
            </label>

            {/* Custom Range select inputs */}
            {tempFilterType === "custom" && (
              <div className="flex items-center gap-4 pt-3 pl-7 animate-in fade-in slide-in-from-top-1 duration-200">
                {/* Start year select */}
                <div className="relative border border-slate-300 rounded-md p-2.5 flex-1 bg-white focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                  <span className="absolute -top-2 left-2 px-1 text-[10px] font-semibold text-muted-foreground bg-white">
                    Año de inicio
                  </span>
                  <select
                    value={tempStartYear}
                    onChange={(e) => setTempStartYear(Number(e.target.value))}
                    className="w-full bg-transparent text-sm focus:outline-none appearance-none cursor-pointer pr-6 font-medium text-foreground"
                  >
                    {displayedYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-xs">
                    ▼
                  </div>
                </div>

                <span className="text-muted-foreground font-semibold">—</span>

                {/* End year select */}
                <div className="relative border border-slate-300 rounded-md p-2.5 flex-1 bg-white focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                  <span className="absolute -top-2 left-2 px-1 text-[10px] font-semibold text-muted-foreground bg-white">
                    Año de finalización
                  </span>
                  <select
                    value={tempEndYear}
                    onChange={(e) => setTempEndYear(Number(e.target.value))}
                    className="w-full bg-transparent text-sm focus:outline-none appearance-none cursor-pointer pr-6 font-medium text-foreground"
                  >
                    {displayedYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-xs">
                    ▼
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end items-center gap-3 pt-6 border-t border-border mt-4">
            <Button
              variant="ghost"
              onClick={() => setCustomModalOpen(false)}
              className="text-primary hover:bg-slate-100 px-4 py-2 rounded-full font-semibold text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setFilterType(tempFilterType);
                if (tempFilterType === "custom") {
                  setCustomStartYear(tempStartYear);
                  setCustomEndYear(tempEndYear);
                }
                setCustomModalOpen(false);
              }}
              className="bg-primary hover:bg-primary/95 text-white px-5 py-2 rounded-full font-semibold text-sm shadow-sm"
              disabled={tempFilterType === "custom" && tempStartYear > tempEndYear}
            >
              Aplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Costos;