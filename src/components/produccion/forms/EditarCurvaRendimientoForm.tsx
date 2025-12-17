import { useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  yieldCurveFormSchema,
  type YieldCurveFormData
} from "@/lib/validationSchemas";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Info, Save, X, Plus } from "lucide-react";

interface EditarCurvaRendimientoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: YieldCurveFormData) => void;
  editingData?: YieldCurveFormData;
}

export function EditarCurvaRendimientoForm({ open, onOpenChange, onSave, editingData }: EditarCurvaRendimientoProps) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<YieldCurveFormData>({
    resolver: zodResolver(yieldCurveFormSchema),
    defaultValues: {
      rows: Array.from({ length: 20 }, (_, i) => ({
        age: i + 1,
        yield_kg: 0,
      })),
    },
  });

  useEffect(() => {
    if (editingData) {
      setValue("rows", editingData.rows);
    }
  }, [editingData, setValue]);

  const watchedRows = watch("rows");

  // Prepare chart data
  const chartData = watchedRows.map(row => ({
    age: row.age,
    kg: row.yield_kg,
  }));

  const addNewRow = () => {
    const maxAge = Math.max(...watchedRows.map(row => row.age));
    const newRow = { age: maxAge + 1, yield_kg: 0 };
    setValue("rows", [...watchedRows, newRow]);
  };

  const onFormSubmit = (data: YieldCurveFormData) => {
    onSave(data);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-6xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold text-foreground">
            Configuración de Curva de Rendimiento
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          <div className="flex-1 p-6">
            <p className="text-muted-foreground mb-4">
              Define cuántos kilos esperas que produzca UN solo árbol según su edad, bajo condiciones normales de manejo.
            </p>

            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> Ingresa el valor unitario por árbol. El sistema calculará automáticamente los totales por hectárea basándose en la densidad de plantación de cada monte.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 h-full min-h-0">
              {/* Left Side: Inputs */}
              <div className="space-y-6 flex flex-col min-h-0">
                <h3 className="text-lg font-semibold">Estándar de Productividad (Kg/Planta)</h3>
                <div className="max-w-sm mx-auto lg:mx-0">
                  <div className="overflow-y-auto space-y-2 max-h-96">
                    {watchedRows.map((row, index) => (
                      <div key={row.age} className="flex items-center gap-4">
                        <Label className="w-20 text-sm font-medium">
                          Año {row.age}
                        </Label>
                        <Controller
                          name={`rows.${index}.yield_kg`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="0.0"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="flex-1"
                            />
                          )}
                        />
                        <span className="text-sm text-muted-foreground w-8">kg</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addNewRow}
                    className="gap-2 mt-4 w-full"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Año
                  </Button>
                  {errors.rows && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.rows.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side: Chart */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Vista Previa de la Curva</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="age"
                        label={{ value: 'Edad (Años)', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis
                        label={{ value: 'Kg por Planta', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value} kg`, "Producción"]}
                        labelFormatter={(label) => `Año ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="kg"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ fill: '#8884d8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons - Fixed at bottom */}
          <div className="flex justify-end gap-3 p-6 bg-background">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(onFormSubmit)}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Guardar y Recalcular Proyecciones
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}