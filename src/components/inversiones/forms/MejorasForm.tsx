import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/calculations";

interface MejorasFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function MejorasForm({ onSave, onCancel, initialData }: MejorasFormProps) {
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState(0);

  useEffect(() => {
    if (initialData) {
      setDescripcion(initialData.descripcion || "");
      setPrecio(initialData.precio || 0);
    }
  }, [initialData]);

  const handleSubmit = () => {
    onSave({
      descripcion,
      precio,
      total: precio,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Descripción</Label>
          <Input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Construcción de galpón"
          />
        </div>

        <div className="space-y-2">
          <Label>Precio</Label>
          <CurrencyInput value={precio} onChange={setPrecio} placeholder="0" />
        </div>
      </div>

      <div className="p-4 bg-secondary/50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium text-foreground">Total Inversión:</span>
          <span className="text-lg font-bold text-primary">{formatCurrency(precio, true)}</span>
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
