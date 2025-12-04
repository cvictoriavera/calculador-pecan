import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  calcularCostoManoObra,
  calcularTotalManoObra,
  formatCurrency,
} from "@/lib/calculations";
import {
  manoObraFormSchema,
  type ManoObraFormData,
} from "@/lib/validationSchemas";

const roles = ["Ing. Agrónomo", "Encargado", "Peón rural", "Tractorista"];

interface ManoObraFormProps {
  onSave: (data: ManoObraFormData) => void;
  onCancel: () => void;
  initialData?: Partial<ManoObraFormData>;
}

export default function ManoObraForm({ onSave, onCancel, initialData }: ManoObraFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ManoObraFormData>({
    resolver: zodResolver(manoObraFormSchema),
    defaultValues: {
      tipo: "mano-obra",
      items: initialData?.items || [{
        id: Date.now().toString(),
        rol: "",
        remuneracion: 0,
        cargasSociales: 0,
        nroPersonas: 1,
      }],
      total: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const totalGeneral = calcularTotalManoObra(watchedItems || []);

  const onSubmit = (data: ManoObraFormData) => {
    onSave({
      ...data,
      total: totalGeneral,
    });
  };

  const addItem = () => {
    append({
      id: Date.now().toString(),
      rol: "",
      remuneracion: 0,
      cargasSociales: 0,
      nroPersonas: 1,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {fields.map((field, index) => {
        const item = watchedItems?.[index];
        return (
          <div
            key={field.id}
            className="p-4 border border-border rounded-lg space-y-3 bg-secondary/30"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <Label className="text-xs">Rol</Label>
                <Controller
                  name={`items.${index}.rol`}
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol..." />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((rol) => (
                          <SelectItem key={rol} value={rol}>
                            {rol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.items?.[index]?.rol && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.items[index]?.rol?.message}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive ml-2"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Remuneración</Label>
                <Controller
                  name={`items.${index}.remuneracion`}
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="0"
                    />
                  )}
                />
                {errors.items?.[index]?.remuneracion && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.items[index]?.remuneracion?.message}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs">Cargas Sociales</Label>
                <Controller
                  name={`items.${index}.cargasSociales`}
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="0"
                    />
                  )}
                />
                {errors.items?.[index]?.cargasSociales && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.items[index]?.cargasSociales?.message}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs">Nro. Personas</Label>
                <Controller
                  name={`items.${index}.nroPersonas`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      placeholder="1"
                      min={1}
                    />
                  )}
                />
                {errors.items?.[index]?.nroPersonas && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.items[index]?.nroPersonas?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <span className="font-semibold text-primary">
                Costo: {formatCurrency(calcularCostoManoObra(
                  item?.remuneracion || 0,
                  item?.cargasSociales || 0,
                  item?.nroPersonas || 1
                ), true)}
              </span>
            </div>
          </div>
        );
      })}

      <Button type="button" variant="outline" className="w-full" onClick={addItem}>
        <Plus className="h-4 w-4 mr-2" />
        Agregar Personal
      </Button>

      {fields.length > 0 && (
        <div className="p-4 bg-primary/10 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Mano de Obra:</span>
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
