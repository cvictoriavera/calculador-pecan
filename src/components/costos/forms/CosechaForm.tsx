import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { calcularTotalCosecha, formatCurrency } from "@/lib/calculations";

const itemsCosecha = [
  { key: "cosecha_maquinaria", label: "Cosecha maquinaria" },
  { key: "cosecha_mano_obra", label: "Cosecha mano de obra" },
  { key: "limpieza_maquinaria", label: "Limpieza maquinaria" },
  { key: "limpieza_mano_obra", label: "Limpieza mano de obra" },
  { key: "cosecha_tercerizada", label: "Cosecha tercerizada" },
  { key: "secado_clasificacion", label: "Secado, clasificación y almacén" },
  { key: "transporte", label: "Transporte nacional e internacional" },
];

interface CosechaFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function CosechaForm({ onSave, onCancel, initialData }: CosechaFormProps) {
  const [valores, setValores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialData?.items) {
      setValores(initialData.items);
    }
  }, [initialData]);

  const updateValor = (key: string, value: number) => {
    setValores({ ...valores, [key]: value });
  };

  const totalGeneral = calcularTotalCosecha(valores);

  const handleSubmit = () => {
    onSave({
      tipo: "cosecha",
      items: valores,
      total: totalGeneral,
    });
  };

  return (
    <div className="space-y-4">
      {itemsCosecha.map((item) => (
        <div key={item.key} className="space-y-1">
          <Label className="text-sm">{item.label}</Label>
          <CurrencyInput
            value={valores[item.key] || ""}
            onChange={(v) => updateValor(item.key, v)}
            placeholder="0"
          />
        </div>
      ))}

      <div className="p-4 bg-primary/10 rounded-lg mt-6">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Cosecha y Poscosecha:</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(totalGeneral, true)}</span>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} className="flex-1" disabled={totalGeneral <= 0}>
          Guardar
        </Button>
      </div>
    </div>
  );
}
