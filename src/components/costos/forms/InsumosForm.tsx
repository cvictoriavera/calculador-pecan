import { useState, useEffect } from "react";
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
import type { InsumoItem } from "@/lib/calculations";
import {
  calcularTotalProductoInsumo,
  calcularCostoLineaInsumo,
  calcularTotalPorTipoInsumo,
  calcularTotalGeneralInsumos,
  formatCurrency,
} from "@/lib/calculations";

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
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function InsumosForm({ onSave, onCancel, initialData }: InsumosFormProps) {
  const [items, setItems] = useState<InsumoItem[]>([]);

  useEffect(() => {
    if (initialData?.items) {
      setItems(initialData.items);
    }
  }, [initialData]);

  const addItem = (tipo: string) => {
    const newItem: InsumoItem = {
      id: Date.now().toString(),
      tipo,
      producto: "",
      precioUnidad: 0,
      dosisMl: 0,
      volumenAplicaciones: 0,
      cantAplicaciones: 0,
      totalProducto: 0,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof InsumoItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };
        const tipoInfo = tiposInsumo[updated.tipo as keyof typeof tiposInsumo];

        if (!tipoInfo?.esFertilizanteSuelo) {
          updated.totalProducto = calcularTotalProductoInsumo(
            updated.dosisMl,
            updated.volumenAplicaciones,
            updated.cantAplicaciones
          );
        }

        return updated;
      })
    );
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleSubmit = () => {
    onSave({
      tipo: "insumos",
      items,
      total: calcularTotalGeneralInsumos(items),
    });
  };

  return (
    <div className="space-y-4">
      <Accordion type="multiple" className="w-full">
        {Object.entries(tiposInsumo).map(([key, tipo]) => {
          const itemsDelTipo = items.filter((item) => item.tipo === key);
          const totalTipo = calcularTotalPorTipoInsumo(items, key);

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
                  {itemsDelTipo.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border border-border rounded-lg space-y-3 bg-secondary/30"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Producto</Label>
                            <Select
                              value={item.producto}
                              onValueChange={(v) => updateItem(item.id, "producto", v)}
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
                          </div>
                          <div>
                            <Label className="text-xs">Precio por unidad</Label>
                            <CurrencyInput
                              value={item.precioUnidad || ""}
                              onChange={(v) => updateItem(item.id, "precioUnidad", v)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {!tipo.esFertilizanteSuelo ? (
                        <>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Dosis (ml)</Label>
                              <Input
                                type="number"
                                value={item.dosisMl || ""}
                                onChange={(e) =>
                                  updateItem(item.id, "dosisMl", parseFloat(e.target.value) || 0)
                                }
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Vol. aplicaciones</Label>
                              <Input
                                type="number"
                                value={item.volumenAplicaciones || ""}
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    "volumenAplicaciones",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Cant. aplicaciones</Label>
                              <Input
                                type="number"
                                value={item.cantAplicaciones || ""}
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    "cantAplicaciones",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-border">
                            <span className="text-sm text-muted-foreground">
                              Total producto: {item.totalProducto.toFixed(2)} L
                            </span>
                            <span className="font-semibold text-primary">
                              Costo: {formatCurrency(calcularCostoLineaInsumo(item.precioUnidad, item.totalProducto), true)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <Label className="text-xs">Total producto utilizado</Label>
                            <Input
                              type="number"
                              value={item.totalProducto || ""}
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  "totalProducto",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                            />
                          </div>
                          <div className="flex justify-end pt-2 border-t border-border">
                            <span className="font-semibold text-primary">
                              Costo: {formatCurrency(calcularCostoLineaInsumo(item.precioUnidad, item.totalProducto), true)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  <Button
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

      {items.length > 0 && (
        <div className="p-4 bg-primary/10 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Insumos:</span>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(calcularTotalGeneralInsumos(items), true)}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} className="flex-1" disabled={items.length === 0}>
          Guardar
        </Button>
      </div>
    </div>
  );
}
