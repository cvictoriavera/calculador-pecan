import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ArrowLeft, Sprout, Leaf, Bug, Zap, Pill, MoreHorizontal } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import {
  calcularTotalProductoInsumo,
  calcularCostoLineaInsumo,
  formatCurrency,
} from "@/lib/calculations";

const tiposInsumo = [
  {
    id: "fertilizantes-suelo",
    label: "Fertilizantes al suelo",
    icon: Sprout,
    color: "bg-green-600",
    opciones: ["Fuente Nitrógeno", "Fósforo", "Potasio", "Zinc", "Orgánico"],
    esFertilizanteSuelo: true,
  },
  {
    id: "fertilizantes-foliares",
    label: "Fertilizantes foliares",
    icon: Leaf,
    color: "bg-emerald-600",
    opciones: ["Zinc", "Boro", "Calcio", "Fósforo", "Magnesio", "Potasio", "Cobre", "Níquel", "Hierro", "Nitrógeno"],
    esFertilizanteSuelo: false,
  },
  {
    id: "fungicidas",
    label: "Fungicidas",
    icon: Pill,
    color: "bg-blue-600",
    opciones: ["Coadyuvantes", "Fungicida 1", "Fungicida 2", "Fungicida 3"],
    esFertilizanteSuelo: false,
  },
  {
    id: "herbicidas",
    label: "Herbicidas",
    icon: Zap,
    color: "bg-orange-600",
    opciones: ["Glifosato", "Coadyuvante", "Herbicida 1", "Herbicida 2", "Herbicida 3"],
    esFertilizanteSuelo: false,
  },
  {
    id: "insecticidas",
    label: "Insecticidas",
    icon: Bug,
    color: "bg-red-600",
    opciones: ["Insecticida 1", "Insecticida 2", "Insecticida 3"],
    esFertilizanteSuelo: false,
  },
  {
    id: "otros",
    label: "Otros",
    icon: MoreHorizontal,
    color: "bg-gray-600",
    opciones: ["Inductor brotación", "Regulador crecimiento"],
    esFertilizanteSuelo: false,
  },
];

interface InsumoItem {
  id: string;
  product: string;
  unit_price: number;
  quantity_used?: number;
  application_dose_ml?: number;
  application_volume_l?: number;
  application_count?: number;
  total_product?: number;
  cost: number;
}

interface InsumosFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
  existingCosts?: any[];
}

export default function InsumosForm({ onSave, onCancel, initialData, existingCosts }: InsumosFormProps) {
  const [isQuickMode, setIsQuickMode] = useState<boolean>(() => {
    // For new loads, start with quick mode (true)
    // For editing, use the mode from initialData (true if quick, false if detailed)
    if (initialData) {
      return initialData.quickMode || false;
    }
    return true;
  });
  const [quickSubtotals, setQuickSubtotals] = useState<Record<string, number>>(() => {
    // Initialize with initialData subtotals if available
    if (initialData?.subtotals) {
      return initialData.subtotals;
    }
    // Initialize all to 0
    const initial: Record<string, number> = {};
    tiposInsumo.forEach(tipo => {
      initial[tipo.id] = 0;
    });
    return initial;
  });
  const [currentStep, setCurrentStep] = useState<'selection' | 'form'>(() => {
    // If we have initialData and not quick mode, start directly in form mode
    return (initialData && !initialData.quickMode) ? 'form' : 'selection';
  });
  const [selectedType, setSelectedType] = useState<typeof tiposInsumo[0] | null>(() => {
    // If we have initialData and not quick mode, find the matching type
    if (initialData?.type && !initialData.quickMode) {
      return tiposInsumo.find(t => t.label === initialData.type) || null;
    }
    return null;
  });
  const [items, setItems] = useState<InsumoItem[]>(() => {
    // Initialize with initialData if available and not quick mode
    if (initialData?.items && Array.isArray(initialData.items) && !initialData.quickMode) {
      return initialData.items.map((item: any, index: number) => ({
        id: item.id || `item_${index + 1}`,
        product: item.product || "",
        unit_price: item.unit_price || 0,
        quantity_used: item.quantity_used,
        application_dose_ml: item.application_dose_ml,
        application_volume_l: item.application_volume_l,
        application_count: item.application_count,
        total_product: item.total_product || 0,
        cost: item.cost || 0,
      }));
    }
    return [];
  });

  const handleTypeSelect = (tipo: typeof tiposInsumo[0]) => {
    setSelectedType(tipo);
    setCurrentStep('form');

    // Check if there's existing data for this type
    const existingCost = existingCosts?.find(cost =>
      cost.category === 'insumos' &&
      cost.details?.type === tipo.label
    );

    if (existingCost && existingCost.details?.items) {
      // Load existing items
      const existingItems = existingCost.details.items.map((item: any, index: number) => ({
        id: item.id || `item_${index + 1}`,
        product: item.product || "",
        unit_price: item.unit_price || 0,
        quantity_used: item.quantity_used,
        application_dose_ml: item.application_dose_ml,
        application_volume_l: item.application_volume_l,
        application_count: item.application_count,
        total_product: item.total_product || 0,
        cost: item.cost || 0,
      }));
      setItems(existingItems);
    } else {
      // Initialize with one empty item
      const newItem: InsumoItem = {
        id: `item_1`,
        product: "",
        unit_price: 0,
        quantity_used: tipo.esFertilizanteSuelo ? 0 : undefined,
        application_dose_ml: tipo.esFertilizanteSuelo ? undefined : 0,
        application_volume_l: tipo.esFertilizanteSuelo ? undefined : 0,
        application_count: tipo.esFertilizanteSuelo ? undefined : 0,
        total_product: 0,
        cost: 0,
      };
      setItems([newItem]);
    }
  };

  const handleBack = () => {
    setCurrentStep('selection');
    setSelectedType(null);
    setItems([]);
  };

  const addItem = () => {
    const nextId = items.length + 1;
    const newItem: InsumoItem = {
      id: `item_${nextId}`,
      product: "",
      unit_price: 0,
      quantity_used: selectedType?.esFertilizanteSuelo ? 0 : undefined,
      application_dose_ml: selectedType?.esFertilizanteSuelo ? undefined : 0,
      application_volume_l: selectedType?.esFertilizanteSuelo ? undefined : 0,
      application_count: selectedType?.esFertilizanteSuelo ? undefined : 0,
      total_product: 0,
      cost: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<InsumoItem>) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates };

        // Recalculate derived fields
        if (!selectedType?.esFertilizanteSuelo && updatedItem.application_dose_ml && updatedItem.application_volume_l && updatedItem.application_count) {
          updatedItem.total_product = calcularTotalProductoInsumo(
            updatedItem.application_dose_ml,
            updatedItem.application_volume_l,
            updatedItem.application_count
          );
        }

        if (updatedItem.unit_price && updatedItem.total_product) {
          updatedItem.cost = calcularCostoLineaInsumo(updatedItem.unit_price, updatedItem.total_product);
        } else if (updatedItem.unit_price && updatedItem.quantity_used) {
          updatedItem.cost = calcularCostoLineaInsumo(updatedItem.unit_price, updatedItem.quantity_used);
        }

        return updatedItem;
      }
      return item;
    }));
  };

  // Get available product options (excluding already selected ones)
  const getAvailableProductOptions = () => {
    const selectedProducts = items.map(item => item.product).filter(product => product.trim() !== '');
    return selectedType?.opciones.filter(option => !selectedProducts.includes(option)) || [];
  };

  const handleSave = () => {
    if (!selectedType || items.length === 0) return;

    // Validate that all required fields are filled
    for (const item of items) {
      if (!item.product || item.product.trim() === '') {
        alert('Por favor selecciona un producto para todos los items.');
        return;
      }
      if (item.unit_price <= 0) {
        alert('Por favor ingresa un precio válido mayor a 0 para todos los items.');
        return;
      }
      if (selectedType.esFertilizanteSuelo) {
        if (!item.quantity_used || item.quantity_used <= 0) {
          alert('Por favor ingresa una cantidad utilizada válida mayor a 0.');
          return;
        }
      } else {
        if (!item.application_dose_ml || item.application_dose_ml <= 0) {
          alert('Por favor ingresa una dosis de aplicación válida mayor a 0.');
          return;
        }
        if (!item.application_volume_l || item.application_volume_l <= 0) {
          alert('Por favor ingresa un volumen de aplicación válido mayor a 0.');
          return;
        }
        if (!item.application_count || item.application_count <= 0) {
          alert('Por favor ingresa una cantidad de aplicaciones válida mayor a 0.');
          return;
        }
      }
      if (item.cost <= 0) {
        alert('El costo calculado debe ser mayor a 0. Verifica que todos los campos estén completos.');
        return;
      }
    }

    const totalCost = items.reduce((sum, item) => sum + item.cost, 0);

    // Check if this type already exists to determine if we need to update
    const existingCost = existingCosts?.find(cost =>
      cost.category === 'insumos' &&
      cost.details?.type === selectedType.label
    );

    const costData = {
      category: "insumos",
      details: {
        type: selectedType.label,
        items: items.map(item => ({
          id: item.id,
          product: item.product,
          unit_price: item.unit_price,
          quantity_used: item.quantity_used,
          application_dose_ml: item.application_dose_ml,
          application_volume_l: item.application_volume_l,
          application_count: item.application_count,
          total_product: item.total_product,
          cost: item.cost,
        })),
        breakdown: {
          total_items: items.length,
          total_quantity: items.reduce((sum, item) => sum + (item.quantity_used || item.total_product || 0), 0),
          total_cost: totalCost,
        }
      },
      total_amount: totalCost,
      existingId: existingCost?.id, // Include existing ID if updating
    };

    onSave(costData);
  };

  // Calculate total for quick mode
  const quickTotal = Object.values(quickSubtotals).reduce((sum, val) => sum + val, 0);

  // Handle quick subtotal change
  const handleQuickSubtotalChange = (tipoId: string, value: number) => {
    setQuickSubtotals(prev => ({
      ...prev,
      [tipoId]: value
    }));
  };

  // Handle save for quick mode
  const handleQuickSave = () => {
    // Validate at least one subtotal > 0
    const hasValidSubtotal = Object.values(quickSubtotals).some(val => val > 0);
    if (!hasValidSubtotal) {
      alert('Por favor ingresa al menos un subtotal mayor a 0.');
      return;
    }

    const costData = {
      category: "insumos",
      details: {
        quickMode: true,
        subtotals: quickSubtotals,
        total: quickTotal,
      },
      total_amount: quickTotal,
      existingId: initialData?.existingId,
    };

    onSave(costData);
  };

  if (isQuickMode) {
    return (
      <div className="space-y-6">
        {/* Mode switch - only show for new entries */}
        {!initialData && (
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-secondary/30">
            <div>
              <Label className="text-sm font-medium">Modo de Carga</Label>
              <p className="text-xs text-muted-foreground">Activa para carga rápida</p>
            </div>
            <Switch
              checked={isQuickMode}
              onCheckedChange={setIsQuickMode}
            />
          </div>
        )}

        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Carga Rápida de Insumos</h3>
          <p className="text-sm text-muted-foreground">
            Ingresa los subtotales para cada tipo de insumo
          </p>
        </div>

        {/* Quick form */}
        <div className="space-y-4">
          {tiposInsumo.map((tipo) => {
            const IconComponent = tipo.icon;
            return (
              <div key={tipo.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                <div className={`p-2 rounded-lg ${tipo.color} text-white flex-shrink-0`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-medium">{tipo.label}</Label>
                </div>
                <div className="w-32">
                  <CurrencyInput
                    value={quickSubtotals[tipo.id] || ""}
                    onChange={(value) => handleQuickSubtotalChange(tipo.id, value)}
                    placeholder="0"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="p-4 bg-primary/10 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Insumos:</span>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(quickTotal, true)}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleQuickSave} className="flex-1" disabled={quickTotal === 0}>
            Guardar
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === 'selection') {
    return (
      <div className="space-y-6">
        {/* Mode switch - only show for new entries */}
        {!initialData && (
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-secondary/30">
            <div>
              <Label className="text-sm font-medium">Modo de Carga</Label>
              <p className="text-xs text-muted-foreground">Activa para carga rápida</p>
            </div>
            <Switch
              checked={isQuickMode}
              onCheckedChange={setIsQuickMode}
            />
          </div>
        )}

        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Seleccionar Tipo de Insumo</h3>
          <p className="text-sm text-muted-foreground">
            Elige el tipo de insumo que deseas registrar
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {tiposInsumo.map((tipo) => {
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
                <span className="font-medium text-sm">{tipo.label}</span>
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
      {/* Mode switch - only show for new entries */}
      {!initialData && (
        <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-secondary/30">
          <div>
            <Label className="text-sm font-medium">Modo de Carga</Label>
            <p className="text-xs text-muted-foreground">Activa para carga rápida</p>
          </div>
          <Switch
            checked={isQuickMode}
            onCheckedChange={setIsQuickMode}
          />
        </div>
      )}

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

      {/* Items list */}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="p-4 border border-border rounded-lg space-y-3 bg-secondary/30">
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-3">
                {/* Product selection */}
                <div>
                  <Label className="text-xs">Producto</Label>
                  <Select
                    value={item.product}
                    onValueChange={(value) => updateItem(item.id, { product: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableProductOptions().map((op) => (
                        <SelectItem key={op} value={op}>
                          {op}
                        </SelectItem>
                      ))}
                      {/* Si ya tiene un producto seleccionado, mostrarlo aunque esté duplicado */}
                      {item.product && !getAvailableProductOptions().includes(item.product) && (
                        <SelectItem value={item.product}>
                          {item.product}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price input */}
                <div>
                  <Label className="text-xs">Precio por unidad</Label>
                  <CurrencyInput
                    value={item.unit_price || ""}
                    onChange={(value) => updateItem(item.id, { unit_price: value })}
                    placeholder="0"
                  />
                </div>

                {/* Conditional fields based on fertilizer type */}
                {selectedType.esFertilizanteSuelo ? (
                  <div>
                    <Label className="text-xs">Total producto utilizado</Label>
                    <Input
                      type="number"
                      value={item.quantity_used || ""}
                      onChange={(e) => updateItem(item.id, { quantity_used: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Dosis (ml)</Label>
                      <Input
                        type="number"
                        value={item.application_dose_ml || ""}
                        onChange={(e) => updateItem(item.id, { application_dose_ml: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Vol. aplicaciones (L)</Label>
                      <Input
                        type="number"
                        value={item.application_volume_l || ""}
                        onChange={(e) => updateItem(item.id, { application_volume_l: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Cant. aplicaciones</Label>
                      <Input
                        type="number"
                        value={item.application_count || ""}
                        onChange={(e) => updateItem(item.id, { application_count: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                {/* Cost display */}
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    {selectedType.esFertilizanteSuelo
                      ? `Total producto: ${item.quantity_used || 0}`
                      : `Total producto: ${item.total_product?.toFixed(2) || 0} L`
                    }
                  </span>
                  <span className="font-semibold text-primary">
                    Costo: {formatCurrency(item.cost, true)}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive ml-2"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={addItem}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Producto
        </Button>
      </div>

      {/* Total and save buttons */}
      {items.length > 0 && (
        <div className="p-4 bg-primary/10 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total {selectedType.label}:</span>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(items.reduce((sum, item) => sum + item.cost, 0), true)}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
          Atrás
        </Button>
        <Button onClick={handleSave} className="flex-1" disabled={items.length === 0}>
          Guardar
        </Button>
      </div>
    </div>
  );
}
