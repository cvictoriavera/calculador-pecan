import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/calculations";
import {
  registrarProduccionFormSchema,
  type RegistrarProduccionFormData
} from "@/lib/validationSchemas";
import {
  Check,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface MonteProduccion {
  monteId: string;
  nombre: string;
  hectareas: number;
  edad: number;
  kgRecolectados: number;
}

interface EditarProduccionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: RegistrarProduccionFormData) => void;
  editingData: {
    precioPromedio: number;
    metodo: "detallado" | "total";
    produccionPorMonte: MonteProduccion[];
  };
}

export function EditarProduccionForm({ open, onOpenChange, onSave, editingData }: EditarProduccionProps) {
  const { currentCampaign, montes } = useApp();
  const [showJovenes, setShowJovenes] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<RegistrarProduccionFormData>({
    resolver: zodResolver(registrarProduccionFormSchema),
    defaultValues: {
      precioPromedio: 0,
      metodo: "detallado",
      pesoTotal: 0,
      montesSeleccionados: [],
      produccionPorMonte: [],
    },
  });


  useEffect(() => {
    if (editingData) {
      setValue("precioPromedio", editingData.precioPromedio);
      setValue("metodo", editingData.metodo);
      if (editingData.metodo === "total") {
        const totalKg = editingData.produccionPorMonte.reduce((acc: number, p: any) => acc + (p.kgRecolectados || 0), 0);
        const montesSeleccionados = editingData.produccionPorMonte
          .filter((p: any) => p.kgRecolectados > 0)
          .map((p: any) => p.monteId);
        setValue("pesoTotal", totalKg);
        setValue("montesSeleccionados", montesSeleccionados);
      } else {
        setValue("pesoTotal", 0);
        setValue("montesSeleccionados", []);
      }
      setValue("produccionPorMonte", editingData.produccionPorMonte);
    }
  }, [editingData, setValue]);

  if (!editingData) return null;

  const watchedValues = watch();
  const watchedMetodo = watch("metodo");
  const watchedPesoTotal = watch("pesoTotal") || 0;
  const watchedMontesSeleccionados = watch("montesSeleccionados") || [];
  const watchedProduccionPorMonte = watch("produccionPorMonte") || [];

  // Filter montes that exist in current campaign
  const montesDisponibles = montes
    .filter((m) => m.añoPlantacion <= currentCampaign)
    .map((m) => ({
      ...m,
      edad: currentCampaign - m.añoPlantacion,
    }));

  const montesProductivos = montesDisponibles.filter((m) => m.edad >= 7);
  const montesJovenes = montesDisponibles.filter((m) => m.edad < 7);

  // Los cálculos siguen igual, basados en el watch original
  const totalKg = watchedProduccionPorMonte.reduce((acc, p) => acc + (p?.kgRecolectados || 0), 0);
  const facturacionEstimada = totalKg * (watchedValues?.precioPromedio || 0);

  const onFormSubmit = (data: RegistrarProduccionFormData) => {
    onSave(data);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold text-foreground">
            Editar Producción {currentCampaign}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 mt-6">
          {/* Precio de Venta */}
          <div>
            <Label>Precio de Venta (USD/Kg)</Label>
            <Controller
              name="precioPromedio"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="0.00"
                />
              )}
            />
            {errors.precioPromedio && (
              <p className="text-sm text-destructive mt-1">
                {errors.precioPromedio.message}
              </p>
            )}
          </div>

          {/* Ingreso de Producción */}
          {watchedMetodo === "detallado" ? (
            <div className="space-y-4">
              {/* Montes Productivos */}
              {montesProductivos.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Montes Productivos ({">"}6 años)
                  </h4>
                  <div className="space-y-3">
                    {montesProductivos.map((monte) => {
                      const index = montesDisponibles.findIndex(m => m.id === monte.id);
                      return (
                        <div
                          key={monte.id}
                          className="flex items-center gap-4 p-3 border rounded-lg bg-card"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-foreground">
                              {monte.nombre}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {monte.hectareas} ha · {monte.edad} años
                            </p>
                          </div>
                          <div className="w-32">
                            <Controller
                              name={`produccionPorMonte.${index}.kgRecolectados`}
                              control={control}
                              render={({ field: inputField }) => (
                                <Input
                                  type="number"
                                  placeholder="Kg"
                                  value={inputField.value || ""}
                                  onChange={(e) => inputField.onChange(parseFloat(e.target.value) || 0)}
                                />
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Montes Jóvenes - Collapsible */}
              {montesJovenes.length > 0 && (
                <div className="border-t pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-between text-muted-foreground"
                    onClick={() => setShowJovenes(!showJovenes)}
                  >
                    <span>
                      Montes en Crecimiento ({montesJovenes.length})
                    </span>
                    {showJovenes ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>

                  {showJovenes && (
                    <div className="space-y-3 mt-3">
                      <p className="text-xs text-muted-foreground">
                        Producción temprana si aplica
                      </p>
                      {montesJovenes.map((monte) => {
                        const index = montesDisponibles.findIndex(m => m.id === monte.id);
                        return (
                          <div
                            key={monte.id}
                            className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">
                                  {monte.nombre}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  Joven
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {monte.hectareas} ha · {monte.edad} años
                              </p>
                            </div>
                            <div className="w-32">
                              <Controller
                                name={`produccionPorMonte.${index}.kgRecolectados`}
                                control={control}
                                render={({ field: inputField }) => (
                                  <Input
                                    type="number"
                                    placeholder="Kg"
                                    value={inputField.value || ""}
                                    onChange={(e) => inputField.onChange(parseFloat(e.target.value) || 0)}
                                />
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
               </div>
             )}
           </div>
         ) : (
            <div className="space-y-6">
              <div>
                <Label>Peso Total Recolectado (Kg)</Label>
                <Controller
                  name="pesoTotal"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      placeholder="Ingrese el peso total"
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(parseFloat(e.target.value) || 0);
                        // Distribute weight proportionally
                        const totalWeight = parseFloat(e.target.value) || 0;
                        const selectedMontes = montesDisponibles.filter(m => watchedMontesSeleccionados.includes(m.id));
                        const totalHectareas = selectedMontes.reduce((acc, m) => acc + m.hectareas, 0);

                        if (totalHectareas > 0) {
                          const newProduccionPorMonte = watchedProduccionPorMonte?.map(p => {
                            if (watchedMontesSeleccionados.includes(p.monteId)) {
                              const monte = selectedMontes.find(m => m.id === p.monteId);
                              const proportion = monte ? monte.hectareas / totalHectareas : 0;
                              return { ...p, kgRecolectados: Math.round(totalWeight * proportion) };
                            }
                            return { ...p, kgRecolectados: 0 };
                          }) || [];
                          setValue("produccionPorMonte", newProduccionPorMonte);
                        }
                      }}
                      className="text-lg h-12"
                    />
                  )}
                />
              </div>

              <div>
                <Label className="mb-3 block">
                  ¿Qué montes contribuyeron a esta cosecha?
                </Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {montesDisponibles.map((monte) => (
                    <div
                      key={monte.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <Controller
                        name="montesSeleccionados"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            checked={field.value?.includes(monte.id) || false}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, monte.id]);
                              } else {
                                field.onChange(current.filter(id => id !== monte.id));
                              }
                            }}
                          />
                        )}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {monte.nombre}
                          </p>
                          {monte.edad < 7 && (
                            <Badge variant="secondary" className="text-xs">
                              Joven
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {monte.hectareas} ha · {monte.edad} años
                        </p>
                      </div>
                      {watchedMontesSeleccionados?.includes(monte.id) && watchedPesoTotal > 0 && (
                        <div className="text-right">
                          <p className="font-medium text-accent">
                            {watchedProduccionPorMonte?.find((p) => p?.monteId === monte.id)?.kgRecolectados?.toLocaleString() || 0}{" "}
                            Kg
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Proporcional
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Resumen de Facturación */}
          <Card className="bg-secondary/30">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Producción Total</span>
                <span className="font-medium">{totalKg.toLocaleString()} Kg</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span className="text-foreground">Total Facturado</span>
                <span className="text-accent">{formatCurrency(facturacionEstimada, true)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Facturación por Monte */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-muted-foreground">
                    Monte
                  </th>
                  <th className="text-right p-3 text-sm font-semibold text-muted-foreground">
                    Producción (Kg)
                  </th>
                  <th className="text-right p-3 text-sm font-semibold text-muted-foreground">
                    Facturación
                  </th>
                </tr>
              </thead>
              <tbody>
                {watchedProduccionPorMonte
                  .filter((p) => p?.kgRecolectados > 0)
                  .map((prod) => (
                    <tr key={prod?.monteId} className="border-t">
                      <td className="p-3 text-sm font-medium text-foreground">
                        {prod?.nombre}
                        {prod?.edad < 7 && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Joven
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-sm text-right text-foreground">
                        {prod?.kgRecolectados.toLocaleString()}
                      </td>
                      <td className="p-3 text-sm text-right text-accent font-medium">
                        {formatCurrency((prod?.kgRecolectados || 0) * (watchedValues?.precioPromedio || 0), true)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Botón de Guardar */}
          <div className="flex justify-end">
            <Button type="submit" className="bg-accent hover:bg-accent/90">
              <Check className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}