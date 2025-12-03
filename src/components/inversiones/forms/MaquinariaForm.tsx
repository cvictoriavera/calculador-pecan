import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency, calcularSubtotalMaquinaria, calcularTotalMaquinaria, type MaquinariaItem } from "@/lib/calculations";

const tiposMaquinaria = [
  "Tractor",
  "Acoplado agrícola",
  "Desmalezadora",
  "Pulverizadora",
  "Fertilizadora",
  "Shaker",
  "Barra de herbicida",
  "Podadora mecánica",
  "Herramienta de poda",
];

interface MaquinariaFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function MaquinariaForm({ onSave, onCancel, initialData }: MaquinariaFormProps) {
  const [items, setItems] = useState<MaquinariaItem[]>(() => [
    { id: Date.now().toString() + Math.random().toString(36), tipo: "", descripcion: "", cantidad: 1, precio: 0 },
  ]);
  const [depreciacion, setDepreciacion] = useState<number>(initialData?.depreciacion || 0);

  useEffect(() => {
    if (initialData?.items && initialData.items.length > 0) {
      setItems(initialData.items);
    }
    if (initialData?.depreciacion !== undefined) {
      setDepreciacion(initialData.depreciacion);
    }
  }, [initialData]);

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString() + Math.random().toString(36), tipo: "", descripcion: "", cantidad: 1, precio: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof MaquinariaItem, value: any) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const total = calcularTotalMaquinaria(items);

  const handleSubmit = () => {
    onSave({
      items,
      depreciacion,
      total,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {items.map((item, index) => {
          const subtotal = calcularSubtotalMaquinaria(item.cantidad, item.precio);
          return (
            <div key={item.id} className="p-4 border border-border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-foreground">Ítem {index + 1}</span>
                {items.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={item.tipo}
                    onValueChange={(value) => updateItem(item.id, "tipo", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposMaquinaria.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input
                    value={item.descripcion}
                    onChange={(e) => updateItem(item.id, "descripcion", e.target.value)}
                    placeholder="Ej: John Deere 6100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.cantidad || ""}
                    onChange={(e) => updateItem(item.id, "cantidad", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Precio unitario</Label>
                  <CurrencyInput
                    value={item.precio}
                    onChange={(value) => updateItem(item.id, "precio", value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Subtotal</Label>
                  <div className="h-9 flex items-center px-3 bg-muted rounded-md text-foreground font-medium">
                    {formatCurrency(subtotal, true)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button variant="outline" onClick={addItem} className="w-full gap-2">
        <Plus className="h-4 w-4" />
        Agregar ítem
      </Button>

      <div className="p-4 border border-border rounded-lg bg-secondary/30">
        <div className="space-y-2">
          <Label>Depreciación (años)</Label>
          <Input
            type="number"
            min="0"
            step="1"
            value={depreciacion || ""}
            onChange={(e) => setDepreciacion(parseInt(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="p-4 bg-secondary/50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium text-foreground">Total:</span>
          <span className="text-lg font-bold text-primary">{formatCurrency(total, true)}</span>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} className="flex-1">
          Guardar
        </Button>
      </div>
    </div>
  );
}
