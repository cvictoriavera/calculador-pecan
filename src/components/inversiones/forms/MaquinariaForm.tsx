import { useState } from "react";
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
import { formatCurrency, calcularSubtotalMaquinaria, type MaquinariaItem } from "@/lib/calculations";

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
  onSave: (data: { tipo: string; descripcion: string; cantidad: number; precio: number; total: number }) => void;
  onCancel: () => void;
  initialData?: { tipo?: string; descripcion?: string; cantidad?: number; precio?: number };
}

export default function MaquinariaForm({ onSave, onCancel, initialData }: MaquinariaFormProps) {
  const [item, setItem] = useState<MaquinariaItem>(() => ({
    id: Date.now().toString() + Math.random().toString(36),
    tipo: initialData?.tipo || "",
    descripcion: initialData?.descripcion || "",
    cantidad: initialData?.cantidad || 1,
    precio: initialData?.precio || 0,
  }));

  const updateItem = (field: keyof MaquinariaItem, value: string | number) => {
    setItem((prev) => ({ ...prev, [field]: value }));
  };

  const subtotal = calcularSubtotalMaquinaria(item.cantidad, item.precio);
  const total = subtotal;

  const handleSubmit = () => {
    onSave({
      tipo: item.tipo,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precio: item.precio,
      total,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="p-4 border border-border rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={item.tipo}
                onValueChange={(value) => updateItem("tipo", value)}
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
                onChange={(e) => updateItem("descripcion", e.target.value)}
                placeholder="Ej: John Deere 6100"
              />
            </div>

            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min="1"
                value={item.cantidad || ""}
                onChange={(e) => updateItem("cantidad", parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label>Precio unitario</Label>
              <CurrencyInput
                value={item.precio}
                onChange={(value) => updateItem("precio", value)}
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
