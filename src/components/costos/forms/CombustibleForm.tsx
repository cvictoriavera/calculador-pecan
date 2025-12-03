import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import type { CombustibleData, CombustibleSubtotales } from "@/lib/calculations";
import {
  calcularSubtotalesCombustible,
  calcularTotalCombustible,
  formatCurrency,
} from "@/lib/calculations";

interface CombustibleFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const defaultData: CombustibleData = {
  valorVehiculo: 0,
  c1_1_gasoilTractor: { cantidad: 0, precio: 0 },
  c1_2_mantenimientoTractor: { cantidad: 0 },
  c1_3_lubricantes: { cantidad: 0 },
  c2_1_nafta: { cantidad: 0, precio: 0 },
  c2_2_impuestos: { cantidad: 0 },
  c2_3_seguro: { cantidad: 0 },
  c2_4_mantenimientoVehiculo: { cantidad: 0 },
  c3_gasoilRiego: { cantidad: 0, precio: 0 },
  c4_otros: { cantidad: 0, precio: 0 },
};

export default function CombustibleForm({ onSave, onCancel, initialData }: CombustibleFormProps) {
  const [data, setData] = useState<CombustibleData>(defaultData);
  const [subtotales, setSubtotales] = useState<CombustibleSubtotales>({
    c1_1: 0, c1_2: 0, c1_3: 0, c2_1: 0, c2_2: 0, c2_3: 0, c2_4: 0, c3: 0, c4: 0,
  });

  useEffect(() => {
    if (initialData?.data) {
      setData(initialData.data);
    }
  }, [initialData]);

  useEffect(() => {
    setSubtotales(calcularSubtotalesCombustible(data));
  }, [data]);

  const totalGeneral = calcularTotalCombustible(subtotales);

  const handleSubmit = () => {
    onSave({
      tipo: "combustible",
      data,
      subtotales,
      total: totalGeneral,
    });
  };

  return (
    <div className="space-y-4">
      {/* Valor del vehículo */}
      <div>
        <Label>Valor del vehículo</Label>
        <CurrencyInput
          value={data.valorVehiculo || ""}
          onChange={(v) => setData({ ...data, valorVehiculo: v })}
          placeholder="0"
        />
      </div>

      {/* C1. Tractores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tractores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* C1.1 */}
          <div className="p-3 bg-secondary/30 rounded-lg space-y-2">
            <Label className="text-xs font-semibold">Gasoil para operaciones mecanizadas</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Cantidad (L)</Label>
                <Input
                  type="number"
                  value={data.c1_1_gasoilTractor.cantidad || ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      c1_1_gasoilTractor: {
                        ...data.c1_1_gasoilTractor,
                        cantidad: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Precio</Label>
                <CurrencyInput
                  value={data.c1_1_gasoilTractor.precio || ""}
                  onChange={(v) =>
                    setData({
                      ...data,
                      c1_1_gasoilTractor: { ...data.c1_1_gasoilTractor, precio: v },
                    })
                  }
                />
              </div>
            </div>
            <p className="text-right text-sm font-semibold text-primary">
              Subtotal: {formatCurrency(subtotales.c1_1, true)}
            </p>
          </div>

          {/* C1.2 */}
          <div className="p-3 bg-secondary/30 rounded-lg space-y-2">
            <Label className="text-xs font-semibold">Mantenimiento tractores agrícolas</Label>
            <div>
              <Label className="text-xs">Cantidad (%)</Label>
              <Input
                type="number"
                value={data.c1_2_mantenimientoTractor.cantidad || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    c1_2_mantenimientoTractor: { cantidad: parseFloat(e.target.value) || 0 },
                  })
                }
              />
            </div>
            <p className="text-right text-sm font-semibold text-primary">
              Subtotal: {formatCurrency(subtotales.c1_2, true)}
            </p>
          </div>

          {/* C1.3 */}
          <div className="p-3 bg-secondary/30 rounded-lg space-y-2">
            <Label className="text-xs font-semibold">Lubricantes</Label>
            <div>
              <Label className="text-xs">Cantidad (%)</Label>
              <Input
                type="number"
                value={data.c1_3_lubricantes.cantidad || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    c1_3_lubricantes: { cantidad: parseFloat(e.target.value) || 0 },
                  })
                }
              />
            </div>
            <p className="text-right text-sm font-semibold text-primary">
              Subtotal: {formatCurrency(subtotales.c1_3, true)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* C2. Vehículo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Vehículo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* C2.1 */}
          <div className="p-3 bg-secondary/30 rounded-lg space-y-2">
            <Label className="text-xs font-semibold">Nafta</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Cantidad (L)</Label>
                <Input
                  type="number"
                  value={data.c2_1_nafta.cantidad || ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      c2_1_nafta: {
                        ...data.c2_1_nafta,
                        cantidad: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Precio</Label>
                <CurrencyInput
                  value={data.c2_1_nafta.precio || ""}
                  onChange={(v) =>
                    setData({
                      ...data,
                      c2_1_nafta: { ...data.c2_1_nafta, precio: v },
                    })
                  }
                />
              </div>
            </div>
            <p className="text-right text-sm font-semibold text-primary">
              Subtotal: {formatCurrency(subtotales.c2_1, true)}
            </p>
          </div>

          {/* C2.2 */}
          <div className="p-3 bg-secondary/30 rounded-lg space-y-2">
            <Label className="text-xs font-semibold">Impuestos</Label>
            <div>
              <Label className="text-xs">Cantidad (% del valor vehículo)</Label>
              <Input
                type="number"
                value={data.c2_2_impuestos.cantidad || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    c2_2_impuestos: { cantidad: parseFloat(e.target.value) || 0 },
                  })
                }
              />
            </div>
            <p className="text-right text-sm font-semibold text-primary">
              Subtotal: {formatCurrency(subtotales.c2_2, true)}
            </p>
          </div>

          {/* C2.3 */}
          <div className="p-3 bg-secondary/30 rounded-lg space-y-2">
            <Label className="text-xs font-semibold">Seguro</Label>
            <div>
              <Label className="text-xs">Cantidad (% del valor vehículo)</Label>
              <Input
                type="number"
                value={data.c2_3_seguro.cantidad || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    c2_3_seguro: { cantidad: parseFloat(e.target.value) || 0 },
                  })
                }
              />
            </div>
            <p className="text-right text-sm font-semibold text-primary">
              Subtotal: {formatCurrency(subtotales.c2_3, true)}
            </p>
          </div>

          {/* C2.4 */}
          <div className="p-3 bg-secondary/30 rounded-lg space-y-2">
            <Label className="text-xs font-semibold">Mantenimiento vehículos</Label>
            <div>
              <Label className="text-xs">Cantidad (% del valor vehículo)</Label>
              <Input
                type="number"
                value={data.c2_4_mantenimientoVehiculo.cantidad || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    c2_4_mantenimientoVehiculo: { cantidad: parseFloat(e.target.value) || 0 },
                  })
                }
              />
            </div>
            <p className="text-right text-sm font-semibold text-primary">
              Subtotal: {formatCurrency(subtotales.c2_4, true)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* C3 y C4 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Otros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* C3 */}
          <div className="p-3 bg-secondary/30 rounded-lg space-y-2">
            <Label className="text-xs font-semibold">Gasoil para riego</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Cantidad (L)</Label>
                <Input
                  type="number"
                  value={data.c3_gasoilRiego.cantidad || ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      c3_gasoilRiego: {
                        ...data.c3_gasoilRiego,
                        cantidad: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Precio</Label>
                <CurrencyInput
                  value={data.c3_gasoilRiego.precio || ""}
                  onChange={(v) =>
                    setData({
                      ...data,
                      c3_gasoilRiego: { ...data.c3_gasoilRiego, precio: v },
                    })
                  }
                />
              </div>
            </div>
            <p className="text-right text-sm font-semibold text-primary">
              Subtotal: {formatCurrency(subtotales.c3, true)}
            </p>
          </div>

          {/* C4 */}
          <div className="p-3 bg-secondary/30 rounded-lg space-y-2">
            <Label className="text-xs font-semibold">Otros</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Cantidad</Label>
                <Input
                  type="number"
                  value={data.c4_otros.cantidad || ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      c4_otros: {
                        ...data.c4_otros,
                        cantidad: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Precio</Label>
                <CurrencyInput
                  value={data.c4_otros.precio || ""}
                  onChange={(v) =>
                    setData({
                      ...data,
                      c4_otros: { ...data.c4_otros, precio: v },
                    })
                  }
                />
              </div>
            </div>
            <p className="text-right text-sm font-semibold text-primary">
              Subtotal: {formatCurrency(subtotales.c4, true)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total */}
      <div className="p-4 bg-primary/10 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Combustible:</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(totalGeneral, true)}</span>
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
