import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  calcularTotalOtros,
  formatCurrency,
} from "@/lib/calculations";
import {
  otrosFormSchema,
  type OtrosFormData,
} from "@/lib/validationSchemas";

interface OtrosFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
  existingCosts?: any[];
}

export default function OtrosForm({ onSave, onCancel, initialData }: OtrosFormProps) {
  const [nextId, setNextId] = useState(1);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OtrosFormData>({
    resolver: zodResolver(otrosFormSchema),
    defaultValues: {
      type: "otros",
      items: initialData?.items || [{
        id: "item_1",
        concepto: "",
        monto: 0,
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const totalGeneral = calcularTotalOtros(watchedItems || []);

  const onSubmit = (data: OtrosFormData) => {
    console.log('OtrosForm onSubmit called with data:', data);

    // Validate that all required fields are filled
    for (const item of data.items) {
      if (!item.concepto || item.concepto.trim() === '') {
        alert('Por favor ingresa el concepto para todos los items.');
        return;
      }
      if (!item.monto || item.monto <= 0) {
        alert('Por favor ingresa un monto válido mayor a 0 para todos los items.');
        return;
      }
    }

    console.log('OtrosForm validation passed, calling onSave');

    // Use the calculated total instead of the form data total
    const calculatedTotal = calcularTotalOtros(data.items);

    onSave({
      category: "otros",
      details: {
        type: "Otros",
        items: data.items,
        total: calculatedTotal,
      },
      total_amount: calculatedTotal,
    });
  };

  const addItem = () => {
    const newId = `item_${nextId}`;
    append({
      id: newId,
      concepto: "",
      monto: 0,
    });
    setNextId(prev => prev + 1);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(onSubmit)(e);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Registra otros costos operativos varios.
      </p>

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="p-4 border border-border rounded-lg space-y-3 bg-secondary/30"
        >
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 space-y-3">
              <div>
                <Label className="text-xs">Concepto / Detalle</Label>
                <Input
                  {...register(`items.${index}.concepto`)}
                  placeholder="Ej: Impuestos provinciales"
                />
                {errors.items?.[index]?.concepto && (
                  <p className="text-xs text-destructive">
                    {errors.items[index]?.concepto?.message}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs">Monto</Label>
                <Controller
                  name={`items.${index}.monto`}
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="0"
                    />
                  )}
                />
                {errors.items?.[index]?.monto && (
                  <p className="text-xs text-destructive">
                    {errors.items[index]?.monto?.message}
                  </p>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" className="w-full" onClick={addItem}>
        <Plus className="h-4 w-4 mr-2" />
        Agregar Concepto
      </Button>

      {fields.length > 0 && (
        <div className="p-4 bg-primary/10 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Otros:</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(totalGeneral, true)}</span>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={fields.length === 0}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
