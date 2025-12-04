import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2 } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import {
  calcularTotalProductoInsumo,
  calcularCostoLineaInsumo,
  calcularTotalPorTipoInsumo,
  calcularTotalGeneralInsumos,
  formatCurrency,
} from "@/lib/calculations";
import {
  insumosFormSchema,
  type InsumosFormData,
} from "@/lib/validationSchemas";

const tiposInsumo = {
  "fertilizantes-suelo": {
    label: "Fertilizantes al suelo",
    opciones: ["Fuente Nitrógeno", "Fósforo", "Potasio", "Zinc", "Orgánico"],
    esFertilizanteSuelo: true,
  },
  "fertilizantes-foliares": {
    label: "Fertilizantes foliares",
    opciones: ["Zinc", "Boro", "Calcio", "Fósforo", "Magnesio", "Potasio", "Cobre", "Níquel", "Hierro", "Nitrógeno"],
    esFertilizanteSuelo: false,
  },
  fungicidas: {
    label: "Fungicidas",
    opciones: ["Coadyuvantes", "Fungicida 1", "Fungicida 2", "Fungicida 3"],
    esFertilizanteSuelo: false,
  },
  herbicidas: {
    label: "Herbicidas",
    opciones: ["Glifosato", "Coadyuvante", "Herbicida 1", "Herbicida 2", "Herbicida 3"],
    esFertilizanteSuelo: false,
  },
  insecticidas: {
    label: "Insecticidas",
    opciones: ["Insecticida 1", "Insecticida 2", "Insecticida 3"],
    esFertilizanteSuelo: false,
  },
  otros: {
    label: "Otros",
    opciones: ["Inductor brotación", "Regulador crecimiento"],
    esFertilizanteSuelo: false,
  },
};

interface InsumosFormProps {
  onSave: (data: InsumosFormData) => void;
  onCancel: () => void;
  initialData?: Partial<InsumosFormData>;
}

export default function InsumosForm({ onSave, onCancel, initialData }: InsumosFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
  } = useForm<InsumosFormData>({
    resolver: zodResolver(insumosFormSchema),
    defaultValues: {
      tipo: "insumos",
      items: initialData?.items || [],
      total: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");

  // Función para recalcular totalProducto cuando cambian los campos
  const recalculateTotalProducto = (index: number) => {
    const item = watchedItems?.[index];
    if (item && !tiposInsumo[item.tipo as keyof typeof tiposInsumo]?.esFertilizanteSuelo) {
      const totalProducto = calcularTotalProductoInsumo(
        item.dosisMl || 0,
        item.volumenAplicaciones || 0,
        item.cantAplicaciones || 0
      );
      setValue(`items.${index}.totalProducto`, totalProducto);
    }
  };

  const addItem = (tipo: string) => {
    append({
      id: Date.now().toString(),
      tipo,
      producto: "",
      precioUnidad: 0,
      dosisMl: 0,
      volumenAplicaciones: 0,
      cantAplicaciones: 0,
      totalProducto: 0,
    });
  };

  const onSubmit = (data: InsumosFormData) => {
    onSave({
      ...data,
      total: calcularTotalGeneralInsumos(data.items),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Accordion type="multiple" className="w-full">
        {Object.entries(tiposInsumo).map(([key, tipo]) => {
          const itemsDelTipo = watchedItems?.filter((item) => item.tipo === key) || [];
          const totalTipo = calcularTotalPorTipoInsumo(watchedItems || [], key);

          return (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <span>{tipo.label}</span>
                  {totalTipo > 0 && (
                    <span className="text-sm text-primary font-semibold">
                      {formatCurrency(totalTipo, true)}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {itemsDelTipo.map((item) => {
                    const globalIndex = watchedItems?.findIndex(i => i.id === item.id) ?? 0;
                    return (
                      <div
                        key={item.id}
                        className="p-4 border border-border rounded-lg space-y-3 bg-secondary/30"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Producto</Label>
                              <Controller
                                name={`items.${globalIndex}.producto`}
                                control={control}
                                render={({ field }) => (
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {tipo.opciones.map((op) => (
                                        <SelectItem key={op} value={op}>
                                          {op}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Precio por unidad</Label>
                              <Controller
                                name={`items.${globalIndex}.precioUnidad`}
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
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => remove(globalIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {!tipo.esFertilizanteSuelo ? (
                          <>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs">Dosis (ml)</Label>
                                <Controller
                                  name={`items.${globalIndex}.dosisMl`}
                                  control={control}
                                  render={({ field }) => (
                                    <Input
                                      type="number"
                                      value={field.value || ""}
                                      onChange={(e) => {
                                        field.onChange(parseFloat(e.target.value) || 0);
                                        recalculateTotalProducto(globalIndex);
                                      }}
                                      placeholder="0"
                                    />
                                  )}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Vol. aplicaciones</Label>
                                <Controller
                                  name={`items.${globalIndex}.volumenAplicaciones`}
                                  control={control}
                                  render={({ field }) => (
                                    <Input
                                      type="number"
                                      value={field.value || ""}
                                      onChange={(e) => {
                                        field.onChange(parseFloat(e.target.value) || 0);
                                        recalculateTotalProducto(globalIndex);
                                      }}
                                      placeholder="0"
                                    />
                                  )}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Cant. aplicaciones</Label>
                                <Controller
                                  name={`items.${globalIndex}.cantAplicaciones`}
                                  control={control}
                                  render={({ field }) => (
                                    <Input
                                      type="number"
                                      value={field.value || ""}
                                      onChange={(e) => {
                                        field.onChange(parseFloat(e.target.value) || 0);
                                        recalculateTotalProducto(globalIndex);
                                      }}
                                      placeholder="0"
                                    />
                                  )}
                                />
                              </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-border">
                              <span className="text-sm text-muted-foreground">
                                Total producto: {item.totalProducto?.toFixed(2) || 0} L
                              </span>
                              <span className="font-semibold text-primary">
                                Costo: {formatCurrency(calcularCostoLineaInsumo(item.precioUnidad || 0, item.totalProducto || 0), true)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <Label className="text-xs">Total producto utilizado</Label>
                              <Controller
                                name={`items.${globalIndex}.totalProducto`}
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
                            </div>
                            <div className="flex justify-end pt-2 border-t border-border">
                              <span className="font-semibold text-primary">
                                Costo: {formatCurrency(calcularCostoLineaInsumo(item.precioUnidad || 0, item.totalProducto || 0), true)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => addItem(key)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar {tipo.label}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {fields.length > 0 && (
        <div className="p-4 bg-primary/10 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Insumos:</span>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(calcularTotalGeneralInsumos(watchedItems || []), true)}
            </span>
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
