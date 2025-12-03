import { useState, useEffect } from "react";
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
import type { StaffItem } from "@/lib/calculations";
import {
  calcularCostoStaff,
  calcularTotalGastosGenerales,
  calcularTotalStaff,
  formatCurrency,
} from "@/lib/calculations";

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
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function GastosAdminForm({ onSave, onCancel, initialData }: GastosAdminFormProps) {
  const [valoresGenerales, setValoresGenerales] = useState<Record<string, number>>({});
  const [staffItems, setStaffItems] = useState<StaffItem[]>([]);

  useEffect(() => {
    if (initialData) {
      if (initialData.gastosGenerales) {
        setValoresGenerales(initialData.gastosGenerales);
      }
      if (initialData.staff) {
        setStaffItems(initialData.staff);
      }
    }
  }, [initialData]);

  const updateValorGeneral = (key: string, value: number) => {
    setValoresGenerales({ ...valoresGenerales, [key]: value });
  };

  const addStaff = () => {
    setStaffItems([
      ...staffItems,
      {
        id: Date.now().toString(),
        rol: "",
        remuneracion: 0,
        cargasSociales: 0,
        nroProfesionales: 1,
      },
    ]);
  };

  const updateStaff = (id: string, field: keyof StaffItem, value: any) => {
    setStaffItems(staffItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const removeStaff = (id: string) => {
    setStaffItems(staffItems.filter((item) => item.id !== id));
  };

  const totalGenerales = calcularTotalGastosGenerales(valoresGenerales);
  const totalStaffCalc = calcularTotalStaff(staffItems);
  const totalGeneral = totalGenerales + totalStaffCalc;

  const handleSubmit = () => {
    onSave({
      tipo: "gastos-admin",
      gastosGenerales: valoresGenerales,
      staff: staffItems,
      totalGenerales,
      totalStaff: totalStaffCalc,
      total: totalGeneral,
    });
  };

  return (
    <div className="space-y-4">
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
                <CurrencyInput
                  value={valoresGenerales[item.key] || ""}
                  onChange={(v) => updateValorGeneral(item.key, v)}
                  placeholder="0"
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
          {staffItems.map((item) => (
            <div
              key={item.id}
              className="p-4 border border-border rounded-lg space-y-3 bg-secondary/30"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Label className="text-xs">Rol</Label>
                  <Select value={item.rol} onValueChange={(v) => updateStaff(item.id, "rol", v)}>
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
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive ml-2"
                  onClick={() => removeStaff(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Remuneración</Label>
                  <CurrencyInput
                    value={item.remuneracion || ""}
                    onChange={(v) => updateStaff(item.id, "remuneracion", v)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Cs Sociales</Label>
                  <CurrencyInput
                    value={item.cargasSociales || ""}
                    onChange={(v) => updateStaff(item.id, "cargasSociales", v)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Nro. Profesionales</Label>
                  <Input
                    type="number"
                    value={item.nroProfesionales || ""}
                    onChange={(e) =>
                      updateStaff(item.id, "nroProfesionales", parseInt(e.target.value) || 1)
                    }
                    placeholder="1"
                    min={1}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <span className="font-semibold text-primary">
                  Costo: {formatCurrency(calcularCostoStaff(item.remuneracion, item.cargasSociales, item.nroProfesionales), true)}
                </span>
              </div>
            </div>
          ))}

          <Button variant="outline" className="w-full" onClick={addStaff}>
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
