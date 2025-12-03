import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/calculations";

interface EnergiaFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function EnergiaForm({ onSave, onCancel, initialData }: EnergiaFormProps) {
  const [tipo, setTipo] = useState<"instalaciones" | "riego">("instalaciones");
  const [subtotalAnual, setSubtotalAnual] = useState<number>(0);

  useEffect(() => {
    if (initialData?.data) {
      setTipo(initialData.data.tipoEnergia || "instalaciones");
      setSubtotalAnual(initialData.data.subtotalAnual || 0);
    }
  }, [initialData]);

  const handleSubmit = () => {
    onSave({
      tipo: "energia",
      data: {
        tipoEnergia: tipo,
        subtotalAnual,
      },
      total: subtotalAnual,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Tipo de Energía</Label>
        <RadioGroup
          value={tipo}
          onValueChange={(v) => setTipo(v as "instalaciones" | "riego")}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="instalaciones" id="instalaciones" />
            <Label htmlFor="instalaciones" className="cursor-pointer">
              Instalaciones
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="riego" id="riego" />
            <Label htmlFor="riego" className="cursor-pointer">
              Riego
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label>Subtotal Anual</Label>
        <CurrencyInput
          value={subtotalAnual || ""}
          onChange={(v) => setSubtotalAnual(v)}
          placeholder="0"
        />
      </div>

      <div className="p-4 bg-primary/10 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Energía Eléctrica:</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(subtotalAnual, true)}</span>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} className="flex-1" disabled={subtotalAnual <= 0}>
          Guardar
        </Button>
      </div>
    </div>
  );
}
