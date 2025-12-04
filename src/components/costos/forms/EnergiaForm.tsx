import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/calculations";
import {
  energiaFormSchema,
  type EnergiaFormData,
} from "@/lib/validationSchemas";

interface EnergiaFormProps {
  onSave: (data: EnergiaFormData) => void;
  onCancel: () => void;
  initialData?: Partial<EnergiaFormData>;
}

export default function EnergiaForm({ onSave, onCancel, initialData }: EnergiaFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EnergiaFormData>({
    resolver: zodResolver(energiaFormSchema),
    defaultValues: {
      tipo: "energia",
      data: {
        tipoEnergia: initialData?.data?.tipoEnergia || "instalaciones",
        subtotalAnual: initialData?.data?.subtotalAnual || 0,
      },
      total: 0,
    },
  });

  const watchedSubtotal = watch("data.subtotalAnual");
  const totalGeneral = watchedSubtotal || 0;

  const onSubmit = (data: EnergiaFormData) => {
    onSave({
      ...data,
      total: totalGeneral,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-3">
        <Label>Tipo de Energía</Label>
        <Controller
          name="data.tipoEnergia"
          control={control}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="instalaciones" id="instalaciones" />
                <Label htmlFor="instalaciones" className="cursor-pointer">
                  Instalaciones
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="riego" id="riego" />
                <Label htmlFor="riego" className="cursor-pointer">
                  Riego
                </Label>
              </div>
            </RadioGroup>
          )}
        />
      </div>

      <div>
        <Label>Subtotal Anual</Label>
        <Controller
          name="data.subtotalAnual"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              value={field.value || ""}
              onChange={field.onChange}
              placeholder="0"
            />
          )}
        />
        {errors.data?.subtotalAnual && (
          <p className="text-xs text-destructive mt-1">
            {errors.data.subtotalAnual.message}
          </p>
        )}
      </div>

      <div className="p-4 bg-primary/10 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Energía Eléctrica:</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(totalGeneral, true)}</span>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={totalGeneral <= 0}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
