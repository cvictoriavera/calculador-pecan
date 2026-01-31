import { useState } from "react";
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
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  Package,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";

interface MonteProduccion {
  monteId: string;
  nombre: string;
  hectareas: number;
  edad: number;
  kgRecolectados: number;
}

interface RegistrarProduccionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: RegistrarProduccionFormData) => void;
  isSaving?: boolean;
  editingData?: {
    precioPromedio: number;
    metodo: "detallado" | "total";
    produccionPorMonte: MonteProduccion[];
  };
}

export function RegistrarProduccionForm({ open, onOpenChange, onSave, editingData, isSaving = false }: RegistrarProduccionProps) {
  const { montes, currentCampaign } = useApp();
  const [step, setStep] = useState(1);
  const [showJovenes, setShowJovenes] = useState(false);

 

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<RegistrarProduccionFormData>({
    resolver: zodResolver(registrarProduccionFormSchema),
    defaultValues: editingData ? {
      precioPromedio: editingData.precioPromedio,
      metodo: editingData.metodo,
      pesoTotal: editingData.metodo === "total" ? editingData.produccionPorMonte.reduce((acc, p) => acc + p.kgRecolectados, 0) : 0,
      montesSeleccionados: editingData.metodo === "total" ? editingData.produccionPorMonte.filter(p => p.kgRecolectados > 0).map(p => p.monteId) : [],
      produccionPorMonte: editingData.produccionPorMonte,
    } : {
      precioPromedio: 0,
      metodo: "detallado",
      pesoTotal: 0,
      montesSeleccionados: montes.filter((m) => m.añoPlantacion <= currentCampaign && (currentCampaign - m.añoPlantacion) >= 7).map((m) => m.id),
      produccionPorMonte: montes
        .filter((m) => m.añoPlantacion <= currentCampaign)
        .map((m) => ({
          monteId: m.id,
          nombre: m.nombre,
          hectareas: m.hectareas,
          edad: currentCampaign - m.añoPlantacion,
          kgRecolectados: 0,
        })),
    },
  });

  const watchedValues = watch();
  const watchedMetodo = watch("metodo");
  const watchedProduccionPorMonte = watch("produccionPorMonte");

  // Filter montes that exist in current campaign
  const montesDisponibles = montes
    .filter((m) => m.añoPlantacion <= currentCampaign)
    .map((m) => ({
      ...m,
      edad: currentCampaign - m.añoPlantacion,
    }));

  const montesProductivos = montesDisponibles.filter((m) => m.edad >= 7);
  const montesJovenes = montesDisponibles.filter((m) => m.edad < 7);


  // Calculate totals from watched values
  const totalKg = watchedProduccionPorMonte?.reduce((acc, p) => acc + (p?.kgRecolectados || 0), 0) || 0;
  const facturacionEstimada = totalKg * (watchedValues?.precioPromedio || 0);

  const canProceedStep1 = (watchedValues?.precioPromedio || 0) > 0 && watchedValues?.metodo;
  const canProceedStep2 = totalKg > 0;


  const onFormSubmit = (data: RegistrarProduccionFormData) => {
    onSave(data);
    reset();
    setStep(1);
    setShowJovenes(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">
            {editingData ? "Editar Producción" : "Cierre de Campaña"} {currentCampaign}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onFormSubmit)}>

        {/* Progress Steps */}
        <div className="flex items-center justify-between my-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <Check className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    step > s ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Configuración Global */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg mb-4">
                Configuración Global
              </h3>

              <div className="space-y-4">
                <div>
                  <Label>Precio Promedio de Venta (USD/Kg)</Label>
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

                <div>
                  <Label className="mb-3 block">Método de Carga</Label>
                  <div className="grid grid-cols-1 gap-4">
                    <Card
                      className={`cursor-pointer transition-all ${
                        watchedMetodo === "detallado"
                          ? "border-primary ring-2 ring-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setValue("metodo", "detallado")}
                    >
                      <CardContent className="p-4 flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-cream">
                          <ClipboardList className="h-6 w-6 text-accent" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground mb-0">
                            Detallado por Monte
                          </p>
                          <p className="text-sm text-muted-foreground mb-0">
                            Tengo el peso de cada lote individual
                          </p>
                        </div>
                        {watchedMetodo === "detallado" && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </CardContent>
                    </Card>

                    <Card
                      className={`cursor-pointer transition-all ${
                        watchedMetodo === "total"
                          ? "border-primary ring-2 ring-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setValue("metodo", "total")}
                    >
                      <CardContent className="p-4 flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-cream">
                          <Package className="h-6 w-6 text-accent" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground mb-0">
                            Total General / A Granel
                          </p>
                          <p className="text-sm text-muted-foreground mb-0">
                            Tengo el ticket de balanza total
                          </p>
                        </div>
                        {watchedMetodo === "total" && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Ingreso de Datos */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">
              Ingreso de Producción
            </h3>

            {watchedMetodo === "detallado" ? (
              <div className="space-y-4">
                {/* Montes Productivos */}
                {montesProductivos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">
                      Montes Productivos ({">"}6 años)
                    </h4>
                    <div className="space-y-3">
                      {montesProductivos.map((monte) => (
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
                              name={`produccionPorMonte.${montesDisponibles.findIndex(m => m.id === monte.id)}.kgRecolectados`}
                              control={control}
                              render={({ field }) => (
                                <Input
                                  type="number"
                                  placeholder="Kg"
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              )}
                            />
                          </div>
                        </div>
                      ))}
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
                          Registrar cosecha temprana si aplica
                        </p>
                        {montesJovenes.map((monte) => (
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
                                name={`produccionPorMonte.${montesDisponibles.findIndex(m => m.id === monte.id)}.kgRecolectados`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    type="number"
                                    placeholder="Kg"
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                )}
                              />
                            </div>
                          </div>
                        ))}
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
                          const watchedMontesSeleccionados = watch("montesSeleccionados") || [];
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
                        {watchedValues?.montesSeleccionados?.includes(monte.id) && (watchedValues?.pesoTotal || 0) > 0 && (
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

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Revisión */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">
              Revisión y Confirmación
            </h3>

            <Card className="bg-secondary/30">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precio Promedio</span>
                  <span className="font-medium">{formatCurrency(watchedValues?.precioPromedio || 0, true)}/Kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Producción Total</span>
                  <span className="font-medium">{totalKg.toLocaleString()} Kg</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span className="text-foreground">Facturación Estimada</span>
                  <span className="text-accent">{formatCurrency(facturacionEstimada, true)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-muted-foreground">
                      Monte
                    </th>
                    <th className="text-right p-3 text-sm font-semibold text-muted-foreground">
                      Hectáreas
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
                    ?.filter((p) => p?.kgRecolectados > 0)
                    .map((prod, index) => (
                      <tr key={prod?.monteId || index} className="border-t">
                        <td className="p-3 text-sm font-medium text-foreground">
                          {prod?.nombre}
                        </td>
                        <td className="p-3 text-sm text-right text-muted-foreground">
                          {prod?.hectareas} ha
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

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <Button 
                type="submit" 
                className="bg-accent hover:bg-accent/90"
                disabled={isSaving} // <--- Deshabilitar al guardar
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar y Guardar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        </form>
      </SheetContent>
    </Sheet>
  );
}
