import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  calcularCostoStaff,
  calcularTotalGastosGenerales,
  calcularTotalStaff,
  formatCurrency,
} from "@/lib/calculations";
import {
  gastosAdminFormSchema,
  type GastosAdminFormData,
} from "@/lib/validationSchemas";

const gastosGenerales = [
  { key: "contador", label: "Contador" },
  { key: "gastos_bancarios", label: "Gastos bancarios" },
  { key: "telefonia", label: "Telefonía" },
  { key: "energia_oficina", label: "Energía eléctrica (oficina)" },
  { key: "internet", label: "Internet" },
  { key: "software", label: "Software gestión" },
  { key: "materiales", label: "Materiales escritorio" },
  { key: "viajes_combustible", label: "Viajes (combustible)" },
  { key: "viajes_viaticos", label: "Viajes (viáticos)" },
  { key: "asociacion", label: "Asociación productores" },
  { key: "publicidad", label: "Publicidad" },
  { key: "seguros", label: "Seguros" },
  { key: "impuestos", label: "Impuestos" },
  { key: "otros", label: "Otros" },
];

const rolesAdmin = [
  "Gerente general",
  "Secretaria",
  "Consultoría Técnica",
  "Consultoría Jurídica",
];

interface GastosAdminFormProps {
  onSave: (data: GastosAdminFormData) => void;
  onCancel: () => void;
  initialData?: Partial<GastosAdminFormData>;
}

export default function GastosAdminForm({ onSave, onCancel, initialData }: GastosAdminFormProps) {
  const {
    control,
    handleSubmit,
    watch,
  } = useForm<GastosAdminFormData>({
    resolver: zodResolver(gastosAdminFormSchema),
    defaultValues: {
      tipo: "gastos-admin",
      gastosGenerales: initialData?.gastosGenerales || {},
      staff: initialData?.staff || [],
      totalGenerales: 0,
      totalStaff: 0,
      total: 0,
    },
  });

  const { fields: staffFields, append: appendStaff, remove: removeStaff } = useFieldArray({
    control,
    name: "staff",
  });

  const watchedGastosGenerales = watch("gastosGenerales");
  const watchedStaff = watch("staff");

  const totalGenerales = calcularTotalGastosGenerales(watchedGastosGenerales || {});
  const totalStaffCalc = calcularTotalStaff(watchedStaff || []);
  const totalGeneral = totalGenerales + totalStaffCalc;

  const addStaff = () => {
    appendStaff({
      id: Date.now().toString(),
      rol: "",
      remuneracion: 0,
      cargasSociales: 0,
      nroProfesionales: 1,
    });
  };

  const onSubmit = (data: GastosAdminFormData) => {
    onSave({
      ...data,
      totalGenerales,
      totalStaff: totalStaffCalc,
      total: totalGeneral,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Tabs defaultValue="generales" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generales">Gastos Generales</TabsTrigger>
          <TabsTrigger value="staff">Staff Administrativo</TabsTrigger>
        </TabsList>

        <TabsContent value="generales" className="space-y-3 mt-4">
          <div className="grid grid-cols-2 gap-3">
            {gastosGenerales.map((item) => (
              <div key={item.key} className="space-y-1">
                <Label className="text-xs">{item.label}</Label>
                <Controller
                  name={`gastosGenerales.${item.key}`}
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="0"
                    />
                  )}
                />
              </div>
            ))}
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm">Subtotal Gastos Generales:</span>
              <span className="font-semibold text-primary">{formatCurrency(totalGenerales, true)}</span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4 mt-4">
          {staffFields.map((field, index) => (
            <div
              key={field.id}
              className="p-4 border border-border rounded-lg space-y-3 bg-secondary/30"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Label className="text-xs">Rol</Label>
                  <Controller
                    name={`staff.${index}.rol`}
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol..." />
                        </SelectTrigger>
                        <SelectContent>
                          {rolesAdmin.map((rol) => (
                            <SelectItem key={rol} value={rol}>
                              {rol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive ml-2"
                  onClick={() => removeStaff(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Remuneración</Label>
                  <Controller
                    name={`staff.${index}.remuneracion`}
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="0"
                      />
                    )}
                  />
                </div>
                <div>
                  <Label className="text-xs">Cs Sociales</Label>
                  <Controller
                    name={`staff.${index}.cargasSociales`}
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="0"
                      />
                    )}
                  />
                </div>
                <div>
                  <Label className="text-xs">Nro. Profesionales</Label>
                  <Controller
                    name={`staff.${index}.nroProfesionales`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        placeholder="1"
                        min={1}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <span className="font-semibold text-primary">
                  Costo: {formatCurrency(calcularCostoStaff(
                    watchedStaff?.[index]?.remuneracion || 0,
                    watchedStaff?.[index]?.cargasSociales || 0,
                    watchedStaff?.[index]?.nroProfesionales || 1
                  ), true)}
                </span>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" className="w-full" onClick={addStaff}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Staff
          </Button>

          <div className="p-3 bg-secondary/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm">Subtotal Staff:</span>
              <span className="font-semibold text-primary">{formatCurrency(totalStaffCalc, true)}</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="p-4 bg-primary/10 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Gastos Administrativos:</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(totalGeneral, true)}</span>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={totalGeneral <= 0}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
