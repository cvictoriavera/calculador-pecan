import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import type { MantenimientoItem } from "@/lib/calculations";
import {
  calcularTotalMantenimientos,
  formatCurrency,
} from "@/lib/calculations";

interface MantenimientosFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function MantenimientosForm({ onSave, onCancel, initialData }: MantenimientosFormProps) {
  const [items, setItems] = useState<MantenimientoItem[]>([]);

  useEffect(() => {
    if (initialData?.items) {
      setItems(initialData.items);
    }
  }, [initialData]);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        nombreHerramienta: "",
        precioReparacion: 0,
      },
    ]);
  };

  const updateItem = (id: string, field: keyof MantenimientoItem, value: any) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const totalGeneral = calcularTotalMantenimientos(items);

  const handleSubmit = () => {
    onSave({
      tipo: "mantenimientos",
      items,
      total: totalGeneral,
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Registra las herramientas reparadas y su costo de reparación.
      </p>

      {items.map((item) => (
        <div
          key={item.id}
          className="p-4 border border-border rounded-lg space-y-3 bg-secondary/30"
        >
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 space-y-3">
              <div>
                <Label className="text-xs">Nombre de la herramienta</Label>
                <Input
                  value={item.nombreHerramienta}
                  onChange={(e) => updateItem(item.id, "nombreHerramienta", e.target.value)}
                  placeholder="Ej: Podadora eléctrica"
                />
              </div>
              <div>
                <Label className="text-xs">Precio reparación</Label>
                <CurrencyInput
                  value={item.precioReparacion || ""}
                  onChange={(v) => updateItem(item.id, "precioReparacion", v)}
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
        </div>
      ))}

      <Button variant="outline" className="w-full" onClick={addItem}>
        <Plus className="h-4 w-4 mr-2" />
        Agregar Herramienta
      </Button>

      {items.length > 0 && (
        <div className="p-4 bg-primary/10 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Mantenimientos:</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(totalGeneral, true)}</span>
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
