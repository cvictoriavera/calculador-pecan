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
  onSave: (data: CosechaFormData) => void;
  onCancel: () => void;
  initialData?: Partial<CosechaFormData>;
}

export default function CosechaForm({ onSave, onCancel, initialData }: CosechaFormProps) {
  const {
    control,
    handleSubmit,
    watch,
  } = useForm<CosechaFormData>({
    resolver: zodResolver(cosechaFormSchema),
    defaultValues: {
      tipo: "cosecha",
      valores: initialData?.valores || {},
      total: 0,
    },
  });

  const watchedValores = watch("valores");
  const totalGeneral = calcularTotalCosecha(watchedValores || {});

  const onSubmit = (data: CosechaFormData) => {
    onSave({
      ...data,
      total: totalGeneral,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <Button type="submit" className="flex-1" disabled={totalGeneral <= 0}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
