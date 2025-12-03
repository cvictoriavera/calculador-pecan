import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { calcularTotalOportunidad, formatCurrency } from "@/lib/calculations";

interface CostosOportunidadFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function CostosOportunidadForm({ onSave, onCancel, initialData }: CostosOportunidadFormProps) {
  const [cantidad, setCantidad] = useState<number>(0);
  const [precioUnidad, setPrecioUnidad] = useState<number>(0);

  useEffect(() => {
    if (initialData?.data) {
      setCantidad(initialData.data.cantidad || 0);
      setPrecioUnidad(initialData.data.precioUnidad || 0);
    }
  }, [initialData]);

  const total = calcularTotalOportunidad(cantidad, precioUnidad);

  const handleSubmit = () => {
    onSave({
      tipo: "costos-oportunidad",
      data: {
        item: "Arrendamiento",
        cantidad,
        precioUnidad,
      },
      total,
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 border border-border rounded-lg bg-secondary/30 space-y-4">
        <h4 className="font-medium">Arrendamiento</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Cantidad</Label>
            <Input
              type="number"
              value={cantidad || ""}
              onChange={(e) => setCantidad(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Precio por unidad</Label>
            <CurrencyInput
              value={precioUnidad || ""}
              onChange={(v) => setPrecioUnidad(v)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="p-4 bg-primary/10 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Costos de Oportunidad:</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(total, true)}</span>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} className="flex-1" disabled={total <= 0}>
          Guardar
        </Button>
      </div>
    </div>
  );
}
