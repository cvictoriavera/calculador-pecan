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
  const { currentCampaign } = useApp();
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
      setValue("pesoTotal", 0);
      setValue("montesSeleccionados", []);
      setValue("produccionPorMonte", editingData.produccionPorMonte);
    }
  }, [editingData, setValue]);

  if (!editingData) return null;

  const watchedValues = watch();
  const watchedProduccionPorMonte = watch("produccionPorMonte") || [];

  // PASO CLAVE: Mapeamos primero para guardar el índice original de cada monte
  // Esto nos permite saber exactamente qué posición actualizar en el array principal
  const montesMapeados = watchedProduccionPorMonte.map((monte, index) => ({
    ...monte,
    originalIndex: index // <--- Guardamos esto como oro
  }));

  // Ahora filtramos sobre la lista que ya tiene el índice guardado
  const montesProductivos = montesMapeados.filter((m) => m.edad >= 7);
  const montesJovenes = montesMapeados.filter((m) => m.edad < 7);

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

          {/* Montes Productivos */}
          {montesProductivos.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Montes Productivos ({">"}6 años)
              </h4>
              <div className="space-y-3">
                {montesProductivos.map((field) => (
                  <div
                    key={field.monteId}
                    className="flex items-center gap-4 p-3 border rounded-lg bg-card"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {field.nombre}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {field.hectareas} ha · {field.edad} años
                      </p>
                    </div>
                    <div className="w-32">
                      <Controller
                        name={`produccionPorMonte.${field.originalIndex}.kgRecolectados`}
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
                    Producción temprana si aplica
                  </p>
                  {montesJovenes.map((field) => (
                    <div
                      key={field.monteId}
                      className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {field.nombre}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            Joven
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {field.hectareas} ha · {field.edad} años
                        </p>
                      </div>
                      <div className="w-32">
                        <Controller
                          name={`produccionPorMonte.${field.originalIndex}.kgRecolectados`}
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
                  ))}
                </div>
              )}
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