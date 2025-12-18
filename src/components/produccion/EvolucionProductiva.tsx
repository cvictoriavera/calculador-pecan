import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, Edit, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditarCurvaRendimientoForm } from "./forms/EditarCurvaRendimientoForm";
import { type YieldCurveFormData } from "@/lib/validationSchemas";
import { useApp } from "@/contexts/AppContext";
import { createYieldModel, updateYieldModel, getYieldModelsByProject } from "@/services/yieldModelService";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProduccionRecord {
  campanaYear: number;
  monteId: string;
  kgRecolectados: number;
}

interface EvolucionProductivaProps {
  campaigns: any[];
  montes: any[];
}

export function EvolucionProductiva({ campaigns, montes }: EvolucionProductivaProps) {
  const { currentProjectId } = useApp();
  const [expandedMontes, setExpandedMontes] = useState<string[]>([]);
  const [yieldCurveOpen, setYieldCurveOpen] = useState(false);
  const [yieldData, setYieldData] = useState<Array<{year: number, kg: number}>>([]);
  const [editingYieldData, setEditingYieldData] = useState<YieldCurveFormData | undefined>(undefined);

  // Fetch yield model on component mount and when project changes
  useEffect(() => {
    const fetchYieldModel = async () => {
      if (!currentProjectId) return;

      try {
        const models = await getYieldModelsByProject(currentProjectId);
        console.log('Yield models found:', models.length, 'models');

        const generalModel = models.find((model: any) => model.variety === 'general' && model.is_active == 1);
        console.log('General model found:', !!generalModel);

        if (generalModel) {
          const parsedData = JSON.parse(generalModel.yield_data);
          setYieldData(parsedData);

          // Prepare editing data for the form
          const formData: YieldCurveFormData = {
            rows: parsedData.map((item: {year: number, kg: number}) => ({
              age: item.year,
              yield_kg: item.kg
            }))
          };
          setEditingYieldData(formData);
        } else {
          setYieldData([]);
          setEditingYieldData(undefined);
        }
      } catch (error) {
        console.error('Error fetching yield model:', error);
        setYieldData([]);
      }
    };

    fetchYieldModel();
  }, [currentProjectId]);

  const toggleMonte = (monteId: string) => {
    setExpandedMontes((prev) =>
      prev.includes(monteId)
        ? prev.filter((id) => id !== monteId)
        : [...prev, monteId]
    );
  };

  // Compute produccionData from campaigns
  const produccionData = useMemo(() => {
    const data: ProduccionRecord[] = [];
    campaigns.forEach(camp => {
      if (camp.montes_production) {
        let prodData = JSON.parse(camp.montes_production);
        if (prodData && typeof prodData === 'object' && prodData.distribucion) {
          prodData = prodData.distribucion;
        }
        Object.entries(prodData).forEach(([monteId, kg]) => {
          data.push({
            campanaYear: camp.year,
            monteId,
            kgRecolectados: kg as number,
          });
        });
      } else if (camp.montes_contribuyentes) {
        const contrib = JSON.parse(camp.montes_contribuyentes);
        const totalProd = camp.total_production;
        const totalArea = contrib.reduce((sum: number, id: string) => {
          const monte = montes.find(m => m.id == id);
          return sum + (monte ? monte.hectareas : 0);
        }, 0);
        contrib.forEach((id: string) => {
          const monte = montes.find(m => m.id == id);
          if (monte && totalArea > 0) {
            const kg = totalProd * (monte.hectareas / totalArea);
            data.push({
              campanaYear: camp.year,
              monteId: id,
              kgRecolectados: kg,
            });
          }
        });
      }
    });
    return data;
  }, [campaigns, montes]);

  // Sort campaigns chronologically
  const sortedCampaigns = useMemo(() => [...campaigns].sort((a, b) => a.year - b.year), [campaigns]);

  // Get production for a specific monte and year
  const getProduccion = (monteId: string, year: number): number | null => {
    const record = produccionData.find(
      (p) => p.monteId === monteId && p.campanaYear === year
    );
    return record ? record.kgRecolectados : null;
  };

  // Check if monte existed in a given year
  const monteExistedInYear = (añoPlantacion: number, year: number): boolean => {
    return year >= añoPlantacion;
  };

  // Calculate age for a monte in a given year
  const calcularEdad = (añoPlantacion: number, year: number): number => {
    return year - añoPlantacion;
  };

  /**
   * Get yield for a specific age from the yield curve
   * Returns kg per tree for the given age, or 0 if not found
   */
  const getYieldForAge = (age: number): number => {
    if (yieldData.length === 0) return 0;

    // Find exact match
    const exactMatch = yieldData.find(item => item.year === age);
    if (exactMatch) return exactMatch.kg;

    // For ages beyond the curve, use the last available value
    if (age > yieldData[yieldData.length - 1].year) {
      return yieldData[yieldData.length - 1].kg;
    }

    // For age 0 or negative, return 0
    if (age <= 0) return 0;

    return 0;
  };

  /**
   * Calculate estimated production for a monte in a given year
   * Formula: (kg/tree from yield curve) * (trees per hectare) * (hectares)
   */
  const calculateEstimatedProduction = (monte: any, year: number): number => {
    const age = calcularEdad(monte.añoPlantacion, year);
    const kgPerTree = getYieldForAge(age);
    const totalTrees = monte.densidad * monte.hectareas;
    return Math.round(kgPerTree * totalTrees);
  };

  /**
   * Calculate deviation percentage between real and estimated production
   * Formula: ((real - estimated) / estimated) * 100
   * Returns null if estimated is 0 (division by zero)
   */
  const calculateDeviation = (real: number, estimated: number): number | null => {
    if (estimated === 0) return null;
    return ((real - estimated) / estimated) * 100;
  };

  // Get deviation color based on rules
  const getDeviationColor = (deviation: number | null): string => {
    if (deviation === null) return 'text-muted-foreground';

    if (deviation >= -10) return 'text-green-600'; // >= 90% of estimated
    if (deviation >= -30) return 'text-yellow-600'; // 70-89% of estimated
    return 'text-red-600'; // < 70% of estimated
  };

  // Get deviation icon
  const getDeviationIcon = (deviation: number | null) => {
    if (deviation === null) return <Minus className="h-3 w-3" />;
    if (deviation >= -10) return <TrendingUp className="h-3 w-3" />;
    if (deviation >= -30) return <Minus className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };

  const handleSaveYieldCurve = async (data: YieldCurveFormData) => {
    if (!currentProjectId) {
      console.error('No current project ID');
      return;
    }

    try {
      // Transform form data to database format
      const yieldData = data.rows.map(row => ({
        year: row.age,
        kg: row.yield_kg
      }));

      // Check if a yield model already exists for this project
      const existingModels = await getYieldModelsByProject(currentProjectId);
      const generalModel = existingModels.find((model: any) => model.variety === 'general');

      if (generalModel) {
        // Update existing model
        await updateYieldModel(generalModel.id, {
          yield_data: JSON.stringify(yieldData)
        });
        console.log('Updated existing yield model');
      } else {
        // Create new model
        await createYieldModel({
          project_id: currentProjectId,
          variety: 'general',
          model_name: 'Modelo General',
          yield_data: JSON.stringify(yieldData),
          is_active: 1
        });
        console.log('Created new yield model');
      }

      // Refresh yield model data
      if (currentProjectId) {
        const models = await getYieldModelsByProject(currentProjectId);
        const generalModel = models.find((model: any) => model.variety === 'general' && model.is_active === 1);
        if (generalModel) {
          const parsedData = JSON.parse(generalModel.yield_data);
          setYieldData(parsedData);
        }
      }

      setYieldCurveOpen(false);
    } catch (error) {
      console.error('Error saving yield curve:', error);
      // TODO: Show error message to user
    }
  };

  return (
    <Card className="border-border/50 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">Evolución Productiva</CardTitle>
        <div className="flex items-center gap-2">
          {yieldData.length === 0 && (
            <span className="text-sm text-amber-600 font-medium">
              ⚠️ Configure la curva de rendimiento para ver estimaciones
            </span>
          )}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setYieldCurveOpen(true)}
          >
            <Edit className="h-5 w-5" />
            Editar Curva de Rendimiento
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="sticky left-0 z-20 bg-card text-left p-2 sm:p-3 text-sm font-semibold text-muted-foreground border-r border-border">
                  Monte
                </th>
                {sortedCampaigns.map((year) => (
                  <th
                    key={year.id}
                    className="text-center p-2 sm:p-3 text-sm font-semibold text-muted-foreground"
                  >
                    {year.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {montes.map((monte) => {
                const isExpanded = expandedMontes.includes(monte.id);

                return (
                  <>
                    {/* Monte Row - Main */}
                    <tr
                      key={monte.id}
                      className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer"
                      onClick={() => toggleMonte(monte.id)}
                    >
                      <td className="sticky left-0 z-10 bg-card p-2 sm:p-3 border-r border-border">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-medium text-foreground">{monte.nombre}</span>
                          <span className="text-xs text-muted-foreground">
                            ({monte.hectareas} ha)
                          </span>
                        </div>
                      </td>
                      {sortedCampaigns.map((year) => {
                        const existed = monteExistedInYear(monte.añoPlantacion, year.year);
                        const produccion = getProduccion(monte.id, year.year);
                        const estimated = existed ? calculateEstimatedProduction(monte, year.year) : 0;
                        const deviation = produccion !== null && estimated > 0 ? calculateDeviation(produccion, estimated) : null;

                        return (
                          <td
                            key={year.id}
                            className={cn(
                              "text-center p-2 sm:p-3 text-sm",
                              !existed && "bg-muted/30"
                            )}
                          >
                            {existed ? (
                              <div className="flex flex-col items-center gap-1">
                                {produccion !== null ? (
                                  <>
                                    <span className="font-medium text-foreground">
                                      {produccion.toLocaleString()} kg
                                    </span>
                                    <div className="flex items-center gap-1 text-xs">
                                      <span className="text-muted-foreground">
                                        Est: {yieldData.length > 0 ? estimated.toLocaleString() : 'N/A'} kg
                                      </span>
                                    </div>
                                    {deviation !== null && yieldData.length > 0 && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <div className={cn("flex items-center gap-1 text-xs font-medium", getDeviationColor(deviation))}>
                                              {getDeviationIcon(deviation)}
                                              {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Desvío: {deviation > 0 ? 'Superó' : 'Por debajo'} de lo estimado</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="text-muted-foreground">-</span>
                                    <div className="text-xs text-muted-foreground">
                                      Est: {yieldData.length > 0 ? estimated.toLocaleString() : 'N/A'} kg
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/50">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Expanded Sub-rows */}
                    {isExpanded && (
                      <>
                        {/* Edad Row */}
                        <tr className="bg-secondary/20 border-b border-border/30">
                          <td className="sticky left-0 z-10 bg-secondary/20 pl-10 p-1 sm:p-2 text-sm text-muted-foreground border-r border-border">
                            Edad
                          </td>
                          {sortedCampaigns.map((year) => {
                            const existed = monteExistedInYear(monte.añoPlantacion, year.year);
                            const edad = calcularEdad(monte.añoPlantacion, year.year);

                            return (
                              <td
                                key={year.id}
                                className={cn(
                                  "text-center p-1 sm:p-2 text-sm",
                                  !existed && "bg-muted/30"
                                )}
                              >
                                {existed ? (
                                  <span className="text-muted-foreground">
                                    {edad} {edad === 1 ? "año" : "años"}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/50">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Producción Real Row */}
                        <tr className="bg-secondary/20 border-b border-border/30">
                          <td className="sticky left-0 z-10 bg-secondary/20 pl-10 p-1 sm:p-2 text-sm text-muted-foreground border-r border-border">
                            Producción Real (Kg)
                          </td>
                          {sortedCampaigns.map((year) => {
                            const existed = monteExistedInYear(monte.añoPlantacion, year.year);
                            const produccion = getProduccion(monte.id, year.year);

                            return (
                              <td
                                key={year.id}
                                className={cn(
                                  "text-center p-1 sm:p-2 text-sm",
                                  !existed && "bg-muted/30"
                                )}
                              >
                                {existed ? (
                                  produccion !== null ? (
                                    <span className="font-medium text-accent">
                                      {produccion.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">0</span>
                                  )
                                ) : (
                                  <span className="text-muted-foreground/50">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Producción Estimada Row */}
                        <tr className="bg-secondary/20 border-b border-border/30">
                          <td className="sticky left-0 z-10 bg-secondary/20 pl-10 p-1 sm:p-2 text-sm text-muted-foreground border-r border-border">
                            Producción Estimada (Kg)
                          </td>
                          {sortedCampaigns.map((year) => {
                            const existed = monteExistedInYear(monte.añoPlantacion, year.year);
                            const estimated = existed ? calculateEstimatedProduction(monte, year.year) : 0;

                            return (
                              <td
                                key={year.id}
                                className={cn(
                                  "text-center p-1 sm:p-2 text-sm",
                                  !existed && "bg-muted/30"
                                )}
                              >
                                {existed ? (
                                  <span className="font-medium text-blue-600">
                                    {yieldData.length > 0 ? estimated.toLocaleString() : 'N/A'}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/50">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Desvío Row */}
                        <tr className="bg-secondary/20 border-b border-border/30">
                          <td className="sticky left-0 z-10 bg-secondary/20 pl-10 p-1 sm:p-2 text-sm text-muted-foreground border-r border-border">
                            Desvío (%)
                          </td>
                          {sortedCampaigns.map((year) => {
                            const existed = monteExistedInYear(monte.añoPlantacion, year.year);
                            const produccion = getProduccion(monte.id, year.year);
                            const estimated = existed ? calculateEstimatedProduction(monte, year.year) : 0;
                            const deviation = produccion !== null && estimated > 0 ? calculateDeviation(produccion, estimated) : null;

                            return (
                              <td
                                key={year.id}
                                className={cn(
                                  "text-center p-1 sm:p-2 text-sm",
                                  !existed && "bg-muted/30"
                                )}
                              >
                                {existed && deviation !== null && yieldData.length > 0 ? (
                                  <div className={cn("flex items-center justify-center gap-1 font-medium", getDeviationColor(deviation))}>
                                    {getDeviationIcon(deviation)}
                                    {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/50">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Productividad Row */}
                        <tr className="bg-secondary/20 border-b border-border/50">
                          <td className="sticky left-0 z-10 bg-secondary/20 pl-10 p-1 sm:p-2 text-sm text-muted-foreground border-r border-border">
                            Productividad (Kg/Ha)
                          </td>
                          {sortedCampaigns.map((year) => {
                            const existed = monteExistedInYear(monte.añoPlantacion, year.year);
                            const produccion = getProduccion(monte.id, year.year);
                            const productividad =
                              produccion !== null && monte.hectareas > 0
                                ? Math.round(produccion / monte.hectareas)
                                : null;

                            return (
                              <td
                                key={year.id}
                                className={cn(
                                  "text-center p-2 text-sm",
                                  !existed && "bg-muted/30"
                                )}
                              >
                                {existed ? (
                                  productividad !== null ? (
                                    <span className="font-medium text-primary">
                                      {productividad.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">0</span>
                                  )
                                ) : (
                                  <span className="text-muted-foreground/50">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      </>
                    )}
                  </>
                );
              })}
            </tbody>
            {/* Totals Row for Billing */}
            <tfoot>
              <tr className="border-t-2 border-border bg-primary/5">
                <td className="sticky left-0 z-20 bg-primary/5 p-2 sm:p-3 border-r border-border">
                  <div className="font-semibold text-foreground">Totales</div>
                </td>
                {sortedCampaigns.map((year) => {
                  const totalReal = montes.reduce((sum, monte) => {
                    const existed = monteExistedInYear(monte.añoPlantacion, year.year);
                    const produccion = getProduccion(monte.id, year.year);
                    return sum + (existed && produccion ? produccion : 0);
                  }, 0);

                  const totalEstimated = montes.reduce((sum, monte) => {
                    const existed = monteExistedInYear(monte.añoPlantacion, year.year);
                    return sum + (existed ? calculateEstimatedProduction(monte, year.year) : 0);
                  }, 0);

                  const totalDeviation = totalEstimated > 0 && yieldData.length > 0 ? calculateDeviation(totalReal, totalEstimated) : null;

                  // Get campaign data for pricing
                  const campaign = campaigns.find(c => c.year === year.year);
                  const precioPromedio = campaign?.average_price ? parseFloat(campaign.average_price) : 0;

                  const facturacionReal = totalReal * precioPromedio;
                  const facturacionEstimada = totalEstimated * precioPromedio;

                  return (
                    <td key={year.id} className="text-center p-2 sm:p-3">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-sm">
                          <div className="font-medium text-foreground">
                            Real: {totalReal.toLocaleString()} kg
                          </div>
                          <div className="text-muted-foreground">
                            Est: {totalEstimated.toLocaleString()} kg
                          </div>
                          {totalDeviation !== null && (
                            <div className={cn("font-medium", getDeviationColor(totalDeviation))}>
                              {totalDeviation > 0 ? '+' : ''}{totalDeviation.toFixed(1)}%
                            </div>
                          )}
                        </div>
                        {precioPromedio > 0 && (
                          <div className="text-xs border-t pt-1 w-full">
                            <div className="text-green-600">
                              Fact. Real: ${facturacionReal.toLocaleString()}
                            </div>
                            <div className="text-blue-600">
                              Fact. Est: ${facturacionEstimada.toLocaleString()}
                            </div>
                            {facturacionEstimada > facturacionReal && (
                              <div className="text-red-600 font-medium">
                                Pérdida: ${(facturacionEstimada - facturacionReal).toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
           </table>
         </ScrollArea>

        {montes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay montes registrados para mostrar la matriz de evolución.
          </div>
        )}
      </CardContent>

      <EditarCurvaRendimientoForm
        open={yieldCurveOpen}
        onOpenChange={setYieldCurveOpen}
        onSave={handleSaveYieldCurve}
        editingData={editingYieldData}
      />
    </Card>
  );
}
