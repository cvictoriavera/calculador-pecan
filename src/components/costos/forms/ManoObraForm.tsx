import { useState, useEffect } from "react";
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
import type { ManoObraItem } from "@/lib/calculations";
import {
  calcularCostoManoObra,
  calcularTotalManoObra,
  formatCurrency,
} from "@/lib/calculations";

const roles = ["Ing. Agrónomo", "Encargado", "Peón rural", "Tractorista"];

interface ManoObraFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function ManoObraForm({ onSave, onCancel, initialData }: ManoObraFormProps) {
  const [items, setItems] = useState<ManoObraItem[]>([]);

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
        rol: "",
        remuneracion: 0,
        cargasSociales: 0,
        nroPersonas: 1,
      },
    ]);
  };

  const updateItem = (id: string, field: keyof ManoObraItem, value: any) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const totalGeneral = calcularTotalManoObra(items);

  const handleSubmit = () => {
    onSave({
      tipo: "mano-obra",
      items,
      total: totalGeneral,
    });
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="p-4 border border-border rounded-lg space-y-3 bg-secondary/30"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Label className="text-xs">Rol</Label>
              <Select value={item.rol} onValueChange={(v) => updateItem(item.id, "rol", v)}>
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
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive ml-2"
              onClick={() => removeItem(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Remuneración</Label>
              <CurrencyInput
                value={item.remuneracion || ""}
                onChange={(v) => updateItem(item.id, "remuneracion", v)}
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs">Cargas Sociales</Label>
              <CurrencyInput
                value={item.cargasSociales || ""}
                onChange={(v) => updateItem(item.id, "cargasSociales", v)}
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs">Nro. Personas</Label>
              <Input
                type="number"
                value={item.nroPersonas || ""}
                onChange={(e) =>
                  updateItem(item.id, "nroPersonas", parseInt(e.target.value) || 1)
                }
                placeholder="1"
                min={1}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <span className="font-semibold text-primary">
              Costo: {formatCurrency(calcularCostoManoObra(item.remuneracion, item.cargasSociales, item.nroPersonas), true)}
            </span>
          </div>
        </div>
      ))}

      <Button variant="outline" className="w-full" onClick={addItem}>
        <Plus className="h-4 w-4 mr-2" />
        Agregar Personal
      </Button>

      {items.length > 0 && (
        <div className="p-4 bg-primary/10 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Mano de Obra:</span>
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
