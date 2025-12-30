import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ArrowLeft, Tractor, Truck, Droplets, MoreHorizontal } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";

const tiposCombustible = [
  {
    id: "tractores",
    label: "Tractores",
    icon: Tractor,
    color: "bg-green-600",
    subtype: "machinery",
    description: "Maquinaria agrícola - mantenimiento basado en combustible",
  },
  {
    id: "vehiculos",
    label: "Vehículos/Rodados",
    icon: Truck,
    color: "bg-blue-600",
    subtype: "vehicles",
    description: "Flota de vehículos - mantenimiento basado en valor",
  },
  {
    id: "riego",
    label: "Riego",
    icon: Droplets,
    color: "bg-cyan-600",
    subtype: "irrigation",
    description: "Combustible para sistemas de riego",
  },
  {
    id: "otros",
    label: "Otros",
    icon: MoreHorizontal,
    color: "bg-gray-600",
    subtype: "other",
    description: "Otros usos de combustible",
  },
];

interface FleetVehicle {
  id: string;
  name: string;
  value: number;
}

interface CombustibleFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
  existingCosts?: any[];
}

export default function CombustibleForm({ onSave, onCancel, initialData, existingCosts }: CombustibleFormProps) {
  const [isQuickMode, setIsQuickMode] = useState<boolean>(() => {
    // For new loads, start with quick mode (true)
    // For editing, use the mode from initialData (true if quick, false if detailed)
    if (initialData) {
      return initialData.quickMode || false;
    }
    return true;
  });
  const [quickTotal, setQuickTotal] = useState<number>(() => {
    // Initialize with initialData total if available
    if (initialData?.total) {
      return initialData.total;
    }
    return 0;
  });
  const [currentStep, setCurrentStep] = useState<'selection' | 'form'>(() => {
    // If we have initialData and not quick mode, start directly in form mode
    return (initialData && !initialData.quickMode) ? 'form' : 'selection';
  });
  const [selectedType, setSelectedType] = useState<typeof tiposCombustible[0] | null>(() => {
    // If we have initialData and not quick mode, find the matching type
    if (initialData?.type && !initialData.quickMode) {
      return tiposCombustible.find(t => t.label === initialData.type) || null;
    }
    return null;
  });

  // Estado para formularios - inicializar con initialData si existe
  const [machineryData, setMachineryData] = useState(() => {
    if (initialData?.type === "Tractores" && initialData.data) {
      return {
        fuel_liters: initialData.data.fuel_liters || 0,
        fuel_price: initialData.data.fuel_price || 0,
        maint_pct_of_fuel: initialData.data.maint_pct_of_fuel || 20,
        lubricant_pct_of_maint: initialData.data.lubricant_pct_of_maint || 15,
      };
    }
    return {
      fuel_liters: 0,
      fuel_price: 0,
      maint_pct_of_fuel: 20,
      lubricant_pct_of_maint: 15,
    };
  });

  const [vehiclesData, setVehiclesData] = useState(() => {
    if ((initialData?.type === "Vehiculos" || initialData?.type === "Vehículos/Rodados") && initialData.data) {
      return {
        fleet_list: initialData.data.fleet_list || [],
        fuel_liters: initialData.data.fuel_liters || 0,
        fuel_price: initialData.data.fuel_price || 0,
        tax_pct: initialData.data.tax_pct || 3,
        insurance_pct: initialData.data.insurance_pct || 3,
        maint_pct: initialData.data.maint_pct || 10,
      };
    }
    return {
      fleet_list: [] as FleetVehicle[],
      fuel_liters: 0,
      fuel_price: 0,
      tax_pct: 3,
      insurance_pct: 3,
      maint_pct: 10,
    };
  });

  const [irrigationData, setIrrigationData] = useState(() => {
    if (initialData?.type === "Riego" && initialData.data) {
      return {
        fuel_liters: initialData.data.fuel_liters || 0,
        fuel_price: initialData.data.fuel_price || 0,
      };
    }
    return {
      fuel_liters: 0,
      fuel_price: 0,
    };
  });

  const [otherData, setOtherData] = useState(() => {
    if (initialData?.type === "Otros" && initialData.data) {
      return {
        fuel_liters: initialData.data.fuel_liters || 0,
        fuel_price: initialData.data.fuel_price || 0,
      };
    }
    return {
      fuel_liters: 0,
      fuel_price: 0,
    };
  });

  const handleTypeSelect = (tipo: typeof tiposCombustible[0]) => {
    setSelectedType(tipo);
    setCurrentStep('form');

    // Check if there's existing data for this type
    const existingCost = existingCosts?.find(cost =>
      cost.category === 'combustible' &&
      cost.details?.type === tipo.label
    );

    if (existingCost && existingCost.details?.data) {
      // Load existing data based on type
      const existingData = existingCost.details.data;

      switch (tipo.subtype) {
        case 'machinery':
          setMachineryData({
            fuel_liters: existingData.fuel_liters || 0,
            fuel_price: existingData.fuel_price || 0,
            maint_pct_of_fuel: existingData.maint_pct_of_fuel || 20,
            lubricant_pct_of_maint: existingData.lubricant_pct_of_maint || 15,
          });
          break;
        case 'vehicles':
          setVehiclesData({
            fleet_list: existingData.fleet_list || [],
            fuel_liters: existingData.fuel_liters || 0,
            fuel_price: existingData.fuel_price || 0,
            tax_pct: existingData.tax_pct || 3,
            insurance_pct: existingData.insurance_pct || 3,
            maint_pct: existingData.maint_pct || 10,
          });
          break;
        case 'irrigation':
          setIrrigationData({
            fuel_liters: existingData.fuel_liters || 0,
            fuel_price: existingData.fuel_price || 0,
          });
          break;
        case 'other':
          setOtherData({
            fuel_liters: existingData.fuel_liters || 0,
            fuel_price: existingData.fuel_price || 0,
          });
          break;
      }
    }
  };

  const handleBack = () => {
    setCurrentStep('selection');
    setSelectedType(null);
  };

  // Funciones para manejar vehículos
  const addVehicle = () => {
    const nextId = vehiclesData.fleet_list.length + 1;
    const newVehicle: FleetVehicle = {
      id: `vehicle_${nextId}`,
      name: "",
      value: 0,
    };
    setVehiclesData(prev => ({
      ...prev,
      fleet_list: [...prev.fleet_list, newVehicle]
    }));
  };

  const removeVehicle = (id: string) => {
    setVehiclesData(prev => ({
      ...prev,
      fleet_list: prev.fleet_list.filter((v: FleetVehicle) => v.id !== id)
    }));
  };

  const updateVehicle = (id: string, updates: Partial<FleetVehicle>) => {
    setVehiclesData(prev => ({
      ...prev,
      fleet_list: prev.fleet_list.map((v: FleetVehicle) =>
        v.id === id ? { ...v, ...updates } : v
      )
    }));
  };

  // Cálculos
  const calculateMachineryTotal = () => {
    const fuelCost = machineryData.fuel_liters * machineryData.fuel_price;
    const maintCost = fuelCost * (machineryData.maint_pct_of_fuel / 100);
    const lubricantCost = maintCost * (machineryData.lubricant_pct_of_maint / 100);
    return {
      fuel_cost: fuelCost,
      maint_cost: maintCost,
      lubricant_cost: lubricantCost,
      total: fuelCost + maintCost + lubricantCost
    };
  };

  const calculateVehiclesTotal = () => {
    const totalFleetValue = vehiclesData.fleet_list.reduce((sum: number, v: FleetVehicle) => sum + v.value, 0);
    const fuelCost = vehiclesData.fuel_liters * vehiclesData.fuel_price;
    const taxCost = totalFleetValue * (vehiclesData.tax_pct / 100);
    const insuranceCost = totalFleetValue * (vehiclesData.insurance_pct / 100);
    const maintCost = totalFleetValue * (vehiclesData.maint_pct / 100);

    return {
      total_fleet_value: totalFleetValue,
      fuel_cost: fuelCost,
      tax_cost: taxCost,
      insurance_cost: insuranceCost,
      maint_cost: maintCost,
      total: fuelCost + taxCost + insuranceCost + maintCost
    };
  };

  const calculateSimpleFuelTotal = (liters: number, price: number) => {
    return liters * price;
  };

  // Handle save for quick mode
  const handleQuickSave = () => {
    // Validate at least total > 0
    if (quickTotal <= 0) {
      alert('Por favor ingresa un total mayor a 0.');
      return;
    }

    const costData = {
      category: "combustible",
      details: {
        quickMode: true,
        total: quickTotal,
      },
      total_amount: quickTotal,
      existingId: initialData?.existingId,
    };

    onSave(costData);
  };

  const handleSave = () => {
    if (!selectedType) {
      alert('Por favor selecciona un tipo de combustible.');
      return;
    }

    let costData;

    // Check if this type already exists to determine if we need to update
    const existingCost = existingCosts?.find(cost =>
      cost.category === 'combustible' &&
      (cost.details?.type === (selectedType.subtype === 'machinery' ? "Tractores" :
                             selectedType.subtype === 'vehicles' ? "Vehículos/Rodados" :
                             selectedType.subtype === 'irrigation' ? "Riego" : "Otros") ||
       cost.details?.type === (selectedType.subtype === 'machinery' ? "Tractores" :
                             selectedType.subtype === 'vehicles' ? "Vehiculos" :
                             selectedType.subtype === 'irrigation' ? "Riego" : "Otros"))
    );

    switch (selectedType.subtype) {
      case 'machinery': {
        if (machineryData.fuel_liters <= 0) {
          alert('Por favor ingresa una cantidad de litros de combustible válida mayor a 0.');
          return;
        }
        if (machineryData.fuel_price <= 0) {
          alert('Por favor ingresa un precio por litro válido mayor a 0.');
          return;
        }
        const machineryBreakdown = calculateMachineryTotal();
        costData = {
          category: "combustible",
          details: {
            type: "Tractores",
            data: machineryData,
            breakdown: machineryBreakdown
          },
          total_amount: machineryBreakdown.total,
          existingId: existingCost?.id, // Include existing ID if updating
        };
        break;
      }

      case 'vehicles': {
        if (vehiclesData.fleet_list.length === 0) {
          alert('Por favor agrega al menos un vehículo a la flota.');
          return;
        }
        for (const vehicle of vehiclesData.fleet_list) {
          if (!vehicle.name || vehicle.name.trim() === '') {
            alert('Por favor ingresa el nombre de todos los vehículos.');
            return;
          }
          if (!vehicle.value || vehicle.value <= 0) {
            alert('Por favor ingresa un valor válido mayor a 0 para todos los vehículos.');
            return;
          }
        }
        if (vehiclesData.fuel_liters <= 0) {
          alert('Por favor ingresa una cantidad de litros de combustible válida mayor a 0.');
          return;
        }
        if (vehiclesData.fuel_price <= 0) {
          alert('Por favor ingresa un precio por litro válido mayor a 0.');
          return;
        }
        const vehiclesBreakdown = calculateVehiclesTotal();
        costData = {
          category: "combustible",
          details: {
            type: "Vehículos/Rodados",
            data: vehiclesData,
            breakdown: vehiclesBreakdown
          },
          total_amount: vehiclesBreakdown.total,
          existingId: existingCost?.id, // Include existing ID if updating
        };
        break;
      }

      case 'irrigation': {
        if (irrigationData.fuel_liters <= 0) {
          alert('Por favor ingresa una cantidad de litros de combustible válida mayor a 0.');
          return;
        }
        if (irrigationData.fuel_price <= 0) {
          alert('Por favor ingresa un precio por litro válido mayor a 0.');
          return;
        }
        const irrigationTotal = calculateSimpleFuelTotal(irrigationData.fuel_liters, irrigationData.fuel_price);
        costData = {
          category: "combustible",
          details: {
            type: "Riego",
            data: irrigationData,
            breakdown: { fuel_cost: irrigationTotal }
          },
          total_amount: irrigationTotal,
          existingId: existingCost?.id, // Include existing ID if updating
        };
        break;
      }

      case 'other': {
        if (otherData.fuel_liters <= 0) {
          alert('Por favor ingresa una cantidad de litros de combustible válida mayor a 0.');
          return;
        }
        if (otherData.fuel_price <= 0) {
          alert('Por favor ingresa un precio por litro válido mayor a 0.');
          return;
        }
        const otherTotal = calculateSimpleFuelTotal(otherData.fuel_liters, otherData.fuel_price);
        costData = {
          category: "combustible",
          details: {
            type: "Otros",
            data: otherData,
            breakdown: { fuel_cost: otherTotal }
          },
          total_amount: otherTotal,
          existingId: existingCost?.id, // Include existing ID if updating
        };
        break;
      }
    }

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
          <h3 className="text-lg font-semibold mb-2">Carga Rápida de Combustible</h3>
          <p className="text-sm text-muted-foreground">
            Ingresa el total de combustible usado en el año
          </p>
        </div>

        {/* Quick form */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total Anual de Combustible</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Total costo de combustible</Label>
                <CurrencyInput
                  value={quickTotal || ""}
                  onChange={setQuickTotal}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Reference list */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Tipos de combustible de referencia</Label>
            <div className="grid grid-cols-2 gap-4">
              {tiposCombustible.map((tipo) => {
                const IconComponent = tipo.icon;
                return (
                  <div key={tipo.id} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-secondary/30">
                    <div className={`p-2 rounded-lg ${tipo.color} text-white flex-shrink-0`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-sm">{tipo.label}</span>
                      <p className="text-xs text-muted-foreground">{tipo.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="p-4 bg-primary/10 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Combustible:</span>
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
          <Button onClick={() => handleQuickSave()} className="flex-1" disabled={quickTotal === 0}>
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
          <h3 className="text-lg font-semibold mb-2">Seleccionar Tipo de Combustible</h3>
          <p className="text-sm text-muted-foreground">
            Elige el tipo de combustible que deseas registrar
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {tiposCombustible.map((tipo) => {
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

      {/* Form content based on selected type */}
      {selectedType.subtype === 'machinery' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Combustible para Tractores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Litros de combustible</Label>
                  <Input
                    type="number"
                    value={machineryData.fuel_liters || ''}
                    onChange={(e) => setMachineryData(prev => ({ ...prev, fuel_liters: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Precio por litro</Label>
                  <CurrencyInput
                    value={machineryData.fuel_price || ''}
                    onChange={(value) => setMachineryData(prev => ({ ...prev, fuel_price: value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mantenimiento (% del combustible)</Label>
                  <Input
                    type="number"
                    value={machineryData.maint_pct_of_fuel || ''}
                    onChange={(e) => setMachineryData(prev => ({ ...prev, maint_pct_of_fuel: parseFloat(e.target.value) || 0 }))}
                    placeholder="20"
                  />
                </div>
                <div>
                  <Label>Lubricantes (% del mantenimiento)</Label>
                  <Input
                    type="number"
                    value={machineryData.lubricant_pct_of_maint || ''}
                    onChange={(e) => setMachineryData(prev => ({ ...prev, lubricant_pct_of_maint: parseFloat(e.target.value) || 0 }))}
                    placeholder="15"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview calculations */}
          <div className="p-4 bg-primary/10 rounded-lg">
            {(() => {
              const breakdown = calculateMachineryTotal();
              return (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Costo de combustible:</span>
                    <span>{formatCurrency(breakdown.fuel_cost, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mantenimiento:</span>
                    <span>{formatCurrency(breakdown.maint_cost, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lubricantes:</span>
                    <span>{formatCurrency(breakdown.lubricant_cost, true)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(breakdown.total, true)}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {selectedType.subtype === 'vehicles' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Flota de Vehículos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fleet list */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Vehículos en la flota</Label>
                {vehiclesData.fleet_list.map((vehicle: FleetVehicle) => (
                  <div key={vehicle.id} className="flex gap-2 items-center mb-2 p-2 bg-secondary/30 rounded">
                    <Input
                      placeholder="Nombre del vehículo"
                      value={vehicle.name}
                      onChange={(e) => updateVehicle(vehicle.id, { name: e.target.value })}
                      className="flex-1"
                    />
                    <CurrencyInput
                      placeholder="Valor"
                      value={vehicle.value || ''}
                      onChange={(value) => updateVehicle(vehicle.id, { value })}
                      className="w-32"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVehicle(vehicle.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addVehicle} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Vehículo
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Litros de combustible</Label>
                  <Input
                    type="number"
                    value={vehiclesData.fuel_liters || ''}
                    onChange={(e) => setVehiclesData(prev => ({ ...prev, fuel_liters: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Precio por litro</Label>
                  <CurrencyInput
                    value={vehiclesData.fuel_price || ''}
                    onChange={(value) => setVehiclesData(prev => ({ ...prev, fuel_price: value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Impuestos (%)</Label>
                  <Input
                    type="number"
                    value={vehiclesData.tax_pct || ''}
                    onChange={(e) => setVehiclesData(prev => ({ ...prev, tax_pct: parseFloat(e.target.value) || 0 }))}
                    placeholder="3"
                  />
                </div>
                <div>
                  <Label>Seguro (%)</Label>
                  <Input
                    type="number"
                    value={vehiclesData.insurance_pct || ''}
                    onChange={(e) => setVehiclesData(prev => ({ ...prev, insurance_pct: parseFloat(e.target.value) || 0 }))}
                    placeholder="3"
                  />
                </div>
                <div>
                  <Label>Mantenimiento (%)</Label>
                  <Input
                    type="number"
                    value={vehiclesData.maint_pct || ''}
                    onChange={(e) => setVehiclesData(prev => ({ ...prev, maint_pct: parseFloat(e.target.value) || 0 }))}
                    placeholder="10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview calculations */}
          <div className="p-4 bg-primary/10 rounded-lg">
            {(() => {
              const breakdown = calculateVehiclesTotal();
              return (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Valor total de flota:</span>
                    <span>{formatCurrency(breakdown.total_fleet_value, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Costo de combustible:</span>
                    <span>{formatCurrency(breakdown.fuel_cost, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impuestos:</span>
                    <span>{formatCurrency(breakdown.tax_cost, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seguro:</span>
                    <span>{formatCurrency(breakdown.insurance_cost, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mantenimiento:</span>
                    <span>{formatCurrency(breakdown.maint_cost, true)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(breakdown.total, true)}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {(selectedType.subtype === 'irrigation' || selectedType.subtype === 'other') && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selectedType.subtype === 'irrigation' ? 'Combustible para Riego' : 'Otros Usos de Combustible'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Litros de combustible</Label>
                  <Input
                    type="number"
                    value={selectedType.subtype === 'irrigation' ? irrigationData.fuel_liters : otherData.fuel_liters || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      if (selectedType.subtype === 'irrigation') {
                        setIrrigationData(prev => ({ ...prev, fuel_liters: value }));
                      } else {
                        setOtherData(prev => ({ ...prev, fuel_liters: value }));
                      }
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Precio por litro</Label>
                  <CurrencyInput
                    value={selectedType.subtype === 'irrigation' ? irrigationData.fuel_price : otherData.fuel_price || ''}
                    onChange={(value) => {
                      if (selectedType.subtype === 'irrigation') {
                        setIrrigationData(prev => ({ ...prev, fuel_price: value }));
                      } else {
                        setOtherData(prev => ({ ...prev, fuel_price: value }));
                      }
                    }}
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview calculations */}
          <div className="p-4 bg-primary/10 rounded-lg">
            {(() => {
              const data = selectedType.subtype === 'irrigation' ? irrigationData : otherData;
              const total = calculateSimpleFuelTotal(data.fuel_liters, data.fuel_price);
              return (
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(total, true)}</span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
          Atrás
        </Button>
        <Button onClick={handleSave} className="flex-1">
          Guardar
        </Button>
      </div>
    </div>
  );
}
