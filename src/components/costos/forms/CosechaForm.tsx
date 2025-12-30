import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { calcularTotalCosecha, formatCurrency } from "@/lib/calculations";
import {
  cosechaFormSchema,
  type CosechaFormData,
} from "@/lib/validationSchemas";

const itemsCosecha = [
  { key: "cosecha_maquinaria", label: "Cosecha maquinaria" },
  { key: "cosecha_mano_obra", label: "Cosecha mano de obra" },
  { key: "limpieza_maquinaria", label: "Limpieza maquinaria" },
  { key: "limpieza_mano_obra", label: "Limpieza mano de obra" },
  { key: "cosecha_tercerizada", label: "Cosecha tercerizada" },
  { key: "secado_clasificacion", label: "Secado, clasificación y almacén" },
  { key: "transporte", label: "Transporte nacional e internacional" },
];

interface CosechaFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
  existingCosts?: any[];
}

export default function CosechaForm({ onSave, onCancel, initialData }: CosechaFormProps) {
  const {
    control,
    getValues,
    watch,
  } = useForm<CosechaFormData>({
    resolver: zodResolver(cosechaFormSchema),
    defaultValues: {
      valores: initialData?.data?.valores || {},
      total: 0,
    },
  });

  const watchedValores = watch("valores");
  const totalGeneral = calcularTotalCosecha(watchedValores || {});

  const onSubmit = (data: CosechaFormData) => {
    console.log('CosechaForm onSubmit called with data:', data);
    // Validate that at least one field has a value > 0
    const hasValidValue = Object.values(data.valores || {}).some(value => value && value > 0);
    console.log('hasValidValue:', hasValidValue);
    if (!hasValidValue) {
      alert('Por favor ingresa al menos un costo válido mayor a 0.');
      return;
    }

    const costData = {
      category: "cosecha",
      details: {
        type: "Cosecha y Poscosecha",
        data: { valores: data.valores },
        breakdown: { total: totalGeneral }
      },
      total_amount: totalGeneral
    };

    console.log('Calling onSave with costData:', costData);
    onSave(costData);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(getValues()); }} className="space-y-4">
      {itemsCosecha.map((item) => (
        <div key={item.key} className="space-y-1">
          <Label className="text-sm">{item.label}</Label>
          <Controller
            name={`valores.${item.key}`}
            control={control}
            render={({ field }) => (
              <CurrencyInput
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="0"
              />
            )}
          />
        </div>
      ))}

      <div className="p-4 bg-primary/10 rounded-lg mt-6">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Cosecha y Poscosecha:</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(totalGeneral, true)}</span>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1">
          Guardar
        </Button>
      </div>
    </form>
  );
}
