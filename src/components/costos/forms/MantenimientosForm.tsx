import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  calcularTotalMantenimientos,
  formatCurrency,
} from "@/lib/calculations";
import {
  mantenimientosFormSchema,
  type MantenimientosFormData,
} from "@/lib/validationSchemas";

interface MantenimientosFormProps {
  onSave: (data: MantenimientosFormData) => void;
  onCancel: () => void;
  initialData?: Partial<MantenimientosFormData>;
  existingCosts?: any[];
}

export default function MantenimientosForm({ onSave, onCancel, initialData }: MantenimientosFormProps) {
  const [nextId, setNextId] = useState(1);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MantenimientosFormData>({
    resolver: zodResolver(mantenimientosFormSchema),
    defaultValues: {
      type: "mantenimientos",
      items: initialData?.items || [{
        id: "item_1",
        nombreHerramienta: "",
        precioReparacion: 0,
      }],
      total: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const totalGeneral = calcularTotalMantenimientos(watchedItems || []);

  const onSubmit = (data: MantenimientosFormData) => {
    // Validate that all required fields are filled
    for (const item of data.items) {
      if (!item.nombreHerramienta || item.nombreHerramienta.trim() === '') {
        alert('Por favor ingresa el nombre de la herramienta para todos los items.');
        return;
      }
      if (!item.precioReparacion || item.precioReparacion <= 0) {
        alert('Por favor ingresa un precio de reparación válido mayor a 0 para todos los items.');
        return;
      }
    }

    onSave({
      ...data,
      total: totalGeneral,
    });
  };

  const addItem = () => {
    const newId = `item_${nextId}`;
    append({
      id: newId,
      nombreHerramienta: "",
      precioReparacion: 0,
    });
    setNextId(prev => prev + 1);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Registra las herramientas reparadas y su costo de reparación.
      </p>

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="p-4 border border-border rounded-lg space-y-3 bg-secondary/30"
        >
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 space-y-3">
              <div>
                <Label className="text-xs">Nombre de la herramienta</Label>
                <Input
                  {...register(`items.${index}.nombreHerramienta`)}
                  placeholder="Ej: Podadora eléctrica"
                />
                {errors.items?.[index]?.nombreHerramienta && (
                  <p className="text-xs text-destructive">
                    {errors.items[index]?.nombreHerramienta?.message}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs">Precio reparación</Label>
                <Controller
                  name={`items.${index}.precioReparacion`}
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="0"
                    />
                  )}
                />
                {errors.items?.[index]?.precioReparacion && (
                  <p className="text-xs text-destructive">
                    {errors.items[index]?.precioReparacion?.message}
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
        Agregar Herramienta
      </Button>

      {fields.length > 0 && (
        <div className="p-4 bg-primary/10 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Mantenimientos:</span>
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
