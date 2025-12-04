import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  calcularSubtotalesCombustible,
  calcularTotalCombustible,
  formatCurrency,
} from "@/lib/calculations";
import {
  combustibleFormSchema,
  type CombustibleFormData,
} from "@/lib/validationSchemas";

interface CombustibleFormProps {
  onSave: (data: CombustibleFormData) => void;
  onCancel: () => void;
  initialData?: Partial<CombustibleFormData>;
}

const defaultData = {
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
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CombustibleFormData>({
    resolver: zodResolver(combustibleFormSchema),
    defaultValues: {
      tipo: "combustible",
      data: initialData?.data || defaultData,
      subtotales: {
        c1_1: 0, c1_2: 0, c1_3: 0, c2_1: 0, c2_2: 0, c2_3: 0, c2_4: 0, c3: 0, c4: 0,
      },
      total: 0,
    },
  });

  const watchedData = watch("data");
  const subtotales = calcularSubtotalesCombustible(watchedData || defaultData);
  const totalGeneral = calcularTotalCombustible(subtotales);

  const onSubmit = (data: CombustibleFormData) => {
    onSave({
      ...data,
      subtotales,
      total: totalGeneral,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Valor del vehículo */}
      <div>
        <Label>Valor del vehículo</Label>
        <Controller
          name="data.valorVehiculo"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              value={field.value || ""}
              onChange={field.onChange}
              placeholder="0"
            />
          )}
        />
        {errors.data?.valorVehiculo && (
          <p className="text-xs text-destructive mt-1">
            {errors.data.valorVehiculo.message}
          </p>
        )}
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
                <Controller
                  name="data.c1_1_gasoilTractor.cantidad"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </div>
              <div>
                <Label className="text-xs">Precio</Label>
                <Controller
                  name="data.c1_1_gasoilTractor.precio"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  )}
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
              <Controller
                name="data.c1_2_mantenimientoTractor.cantidad"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
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
              <Controller
                name="data.c1_3_lubricantes.cantidad"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
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
                <Controller
                  name="data.c2_1_nafta.cantidad"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </div>
              <div>
                <Label className="text-xs">Precio</Label>
                <Controller
                  name="data.c2_1_nafta.precio"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  )}
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
              <Controller
                name="data.c2_2_impuestos.cantidad"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
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
              <Controller
                name="data.c2_3_seguro.cantidad"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
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
              <Controller
                name="data.c2_4_mantenimientoVehiculo.cantidad"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
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
                <Controller
                  name="data.c3_gasoilRiego.cantidad"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </div>
              <div>
                <Label className="text-xs">Precio</Label>
                <Controller
                  name="data.c3_gasoilRiego.precio"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  )}
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
                <Controller
                  name="data.c4_otros.cantidad"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </div>
              <div>
                <Label className="text-xs">Precio</Label>
                <Controller
                  name="data.c4_otros.precio"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  )}
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
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1">
          Guardar
        </Button>
      </div>
    </form>
  );
}
