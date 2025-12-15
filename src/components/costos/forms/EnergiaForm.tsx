import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/calculations";
import { Zap, ArrowLeft } from "lucide-react";

const tiposEnergia = [
  {
    id: "Instalaciones",
    label: "Instalaciones",
    icon: Zap,
    color: "bg-blue-600",
    description: "Energía para instalaciones generales"
  },
  {
    id: "Riego",
    label: "Riego",
    icon: Zap,
    color: "bg-green-600",
    description: "Energía para sistemas de riego"
  },
];

interface EnergiaFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
  existingCosts?: any[];
}

export default function EnergiaForm({ onSave, onCancel, initialData, existingCosts }: EnergiaFormProps) {
  const [currentStep, setCurrentStep] = useState<'selection' | 'form'>(() => {
    // If we have initialData, start directly in form mode
    return initialData ? 'form' : 'selection';
  });
  const [selectedType, setSelectedType] = useState<typeof tiposEnergia[0] | null>(() => {
    // If we have initialData, find the matching type
    if (initialData?.type) {
      return tiposEnergia.find(t => t.label === initialData.type) || null;
    }
    return null;
  });
  const [subtotalAnual, setSubtotalAnual] = useState(() => {
    // Initialize with initialData if available
    return initialData?.data?.subtotalAnual || 0;
  });

  const handleTypeSelect = (tipo: typeof tiposEnergia[0]) => {
    setSelectedType(tipo);
    setCurrentStep('form');

    // If we have initialData for this type, use it
    if (initialData?.type === tipo.label && initialData?.data) {
      setSubtotalAnual(initialData.data.subtotalAnual || 0);
      return;
    }

    // Check if there's existing data for this type
    const existingCost = existingCosts?.find(cost =>
      cost.category === 'energia' &&
      cost.details?.type === tipo.label
    );

    if (existingCost && existingCost.details?.data) {
      // Load existing data
      setSubtotalAnual(existingCost.details.data.subtotalAnual || 0);
    } else {
      // Reset to default
      setSubtotalAnual(0);
    }
  };

  const handleBack = () => {
    setCurrentStep('selection');
    setSelectedType(null);
    setSubtotalAnual(0);
  };

  const handleSave = () => {
    if (!selectedType) {
      alert('Por favor selecciona un tipo de energía.');
      return;
    }
    if (subtotalAnual <= 0) {
      alert('Por favor ingresa un subtotal anual válido mayor a 0.');
      return;
    }

    // Check if this type already exists to determine if we need to update
    const existingCost = existingCosts?.find(cost =>
      cost.category === 'energia' &&
      cost.details?.type === selectedType.label
    );

    const costData = {
      category: "energia",
      details: {
        type: selectedType.label,
        data: {
          subtotalAnual: subtotalAnual,
        }
      },
      total_amount: subtotalAnual,
      existingId: existingCost?.id, // Include existing ID if updating
    };

    onSave(costData);
  };

  if (currentStep === 'selection') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Seleccionar Tipo de Energía</h3>
          <p className="text-sm text-muted-foreground">
            Elige el tipo de energía que deseas registrar
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {tiposEnergia.map((tipo) => {
            const IconComponent = tipo.icon;
            return (
              <button
                key={tipo.id}
                onClick={() => handleTypeSelect(tipo)}
                className="flex flex-col items-center gap-3 p-6 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-center"
              >
                <div className={`p-3 rounded-lg ${tipo.color} text-white`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-medium text-sm">{tipo.label}</span>
                  <p className="text-xs text-muted-foreground mt-1">{tipo.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  if (!selectedType) return null;

  const IconComponent = selectedType.icon;

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${selectedType.color} text-white`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold">{selectedType.label}</h3>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <Label className="text-sm">Subtotal Anual</Label>
          <CurrencyInput
            value={subtotalAnual || ""}
            onChange={setSubtotalAnual}
            placeholder="0"
          />
        </div>

        {/* Total display */}
        {subtotalAnual > 0 && (
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total {selectedType.label}:</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(subtotalAnual, true)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
          Atrás
        </Button>
        <Button onClick={handleSave} className="flex-1" disabled={subtotalAnual <= 0}>
          Guardar
        </Button>
      </div>
    </div>
  );
}
