import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
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
}

export default function CombustibleForm({ onSave, onCancel }: CombustibleFormProps) {
  const [currentStep, setCurrentStep] = useState<'selection' | 'form'>('selection');
  const [selectedType, setSelectedType] = useState<typeof tiposCombustible[0] | null>(null);

  // Estado para formularios
  const [machineryData, setMachineryData] = useState({
    fuel_liters: 0,
    fuel_price: 0,
    maint_pct_of_fuel: 20,
    lubricant_pct_of_maint: 15,
  });

  const [vehiclesData, setVehiclesData] = useState({
    fleet_list: [] as FleetVehicle[],
    fuel_liters: 0,
    fuel_price: 0,
    tax_pct: 3,
    insurance_pct: 3,
    maint_pct: 10,
  });

  const [irrigationData, setIrrigationData] = useState({
    fuel_liters: 0,
    fuel_price: 0,
  });

  const [otherData, setOtherData] = useState({
    fuel_liters: 0,
    fuel_price: 0,
  });

  const handleTypeSelect = (tipo: typeof tiposCombustible[0]) => {
    setSelectedType(tipo);
    setCurrentStep('form');
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
      fleet_list: prev.fleet_list.filter(v => v.id !== id)
    }));
  };

  const updateVehicle = (id: string, updates: Partial<FleetVehicle>) => {
    setVehiclesData(prev => ({
      ...prev,
      fleet_list: prev.fleet_list.map(v =>
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
    const totalFleetValue = vehiclesData.fleet_list.reduce((sum, v) => sum + v.value, 0);
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

  const handleSave = () => {
    if (!selectedType) return;

    let costData;

    switch (selectedType.subtype) {
      case 'machinery': {
        const machineryBreakdown = calculateMachineryTotal();
        costData = {
          category: "combustible",
          details: {
            type: "Tractores",
            data: machineryData,
            breakdown: machineryBreakdown
          },
          total_amount: machineryBreakdown.total
        };
        break;
      }

      case 'vehicles': {
        const vehiclesBreakdown = calculateVehiclesTotal();
        costData = {
          category: "combustible",
          details: {
            type: "Vehiculos",
            data: vehiclesData,
            breakdown: vehiclesBreakdown
          },
          total_amount: vehiclesBreakdown.total
        };
        break;
      }

      case 'irrigation': {
        const irrigationTotal = calculateSimpleFuelTotal(irrigationData.fuel_liters, irrigationData.fuel_price);
        costData = {
          category: "combustible",
          details: {
            type: "Riego",
            data: irrigationData,
            breakdown: { fuel_cost: irrigationTotal }
          },
          total_amount: irrigationTotal
        };
        break;
      }

      case 'other': {
        const otherTotal = calculateSimpleFuelTotal(otherData.fuel_liters, otherData.fuel_price);
        costData = {
          category: "combustible",
          details: {
            type: "Otros",
            data: otherData,
            breakdown: { fuel_cost: otherTotal }
          },
          total_amount: otherTotal
        };
        break;
      }
    }

    onSave(costData);
  };

  if (currentStep === 'selection') {
    return (
      <div className="space-y-6">
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
                {vehiclesData.fleet_list.map((vehicle) => (
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
