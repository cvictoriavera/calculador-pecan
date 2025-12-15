import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { calcularTotalOportunidad, formatCurrency } from "@/lib/calculations";
import {
  costosOportunidadFormSchema,
  type CostosOportunidadFormData,
} from "@/lib/validationSchemas";

interface CostosOportunidadFormProps {
  onSave: (data: CostosOportunidadFormData) => void;
  onCancel: () => void;
  initialData?: Partial<CostosOportunidadFormData>;
}

export default function CostosOportunidadForm({ onSave, onCancel, initialData }: CostosOportunidadFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CostosOportunidadFormData>({
    resolver: zodResolver(costosOportunidadFormSchema),
    defaultValues: {
      type: "costos-oportunidad",
      cantidad: initialData?.cantidad || 0,
      precioUnidad: initialData?.precioUnidad || 0,
      total: 0,
    },
  });

  const watchedCantidad = watch("cantidad");
  const watchedPrecio = watch("precioUnidad");
  const total = calcularTotalOportunidad(watchedCantidad || 0, watchedPrecio || 0);

  const onSubmit = (data: CostosOportunidadFormData) => {
    onSave({
      ...data,
      total,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="p-4 border border-border rounded-lg bg-secondary/30 space-y-4">
        <h4 className="font-medium">Arrendamiento</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Cantidad</Label>
            <Controller
              name="cantidad"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              )}
            />
            {errors.cantidad && (
              <p className="text-xs text-destructive mt-1">
                {errors.cantidad.message}
              </p>
            )}
          </div>
          <div>
            <Label>Precio por unidad</Label>
            <Controller
              name="precioUnidad"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="0"
                />
              )}
            />
            {errors.precioUnidad && (
              <p className="text-xs text-destructive mt-1">
                {errors.precioUnidad.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-primary/10 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Costos de Oportunidad:</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(total, true)}</span>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={total <= 0}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
