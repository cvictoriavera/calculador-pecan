import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [expandedMontes, setExpandedMontes] = useState<string[]>([]);

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
        const prod = JSON.parse(camp.montes_production);
        Object.entries(prod).forEach(([monteId, kg]) => {
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

  return (
    <Card className="border-border/50 shadow-md">
      <CardHeader>
        <CardTitle className="text-foreground">Evolución Productiva</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr className="border-b border-border">
                <th className="sticky left-0 z-20 bg-card text-left p-3 text-sm font-semibold text-muted-foreground min-w-[200px] border-r border-border">
                  Monte
                </th>
                {sortedCampaigns.map((year) => (
                  <th
                    key={year.id}
                    className="text-center p-3 text-sm font-semibold text-muted-foreground min-w-[100px]"
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
                      <td className="sticky left-0 z-10 bg-card p-3 border-r border-border">
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

                        return (
                          <td
                            key={year.id}
                            className={cn(
                              "text-center p-3 text-sm",
                              !existed && "bg-muted/30"
                            )}
                          >
                            {existed ? (
                              produccion !== null ? (
                                <span className="font-medium text-foreground">
                                  {produccion.toLocaleString()} kg
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )
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
                          <td className="sticky left-0 z-10 bg-secondary/20 pl-10 p-2 text-sm text-muted-foreground border-r border-border">
                            Edad
                          </td>
                          {sortedCampaigns.map((year) => {
                            const existed = monteExistedInYear(monte.añoPlantacion, year.year);
                            const edad = calcularEdad(monte.añoPlantacion, year.year);

                            return (
                              <td
                                key={year.id}
                                className={cn(
                                  "text-center p-2 text-sm",
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

                        {/* Producción Row */}
                        <tr className="bg-secondary/20 border-b border-border/30">
                          <td className="sticky left-0 z-10 bg-secondary/20 pl-10 p-2 text-sm text-muted-foreground border-r border-border">
                            Producción (Kg)
                          </td>
                          {sortedCampaigns.map((year) => {
                            const existed = monteExistedInYear(monte.añoPlantacion, year.year);
                            const produccion = getProduccion(monte.id, year.year);

                            return (
                              <td
                                key={year.id}
                                className={cn(
                                  "text-center p-2 text-sm",
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

                        {/* Productividad Row */}
                        <tr className="bg-secondary/20 border-b border-border/50">
                          <td className="sticky left-0 z-10 bg-secondary/20 pl-10 p-2 text-sm text-muted-foreground border-r border-border">
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
          </table>
        </div>

        {montes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay montes registrados para mostrar la matriz de evolución.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
