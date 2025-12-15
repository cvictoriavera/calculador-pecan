import { useState } from "react";
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
import { Plus, Trash2, ArrowLeft, FileText, Users } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  calcularCostoStaff,
  formatCurrency,
} from "@/lib/calculations";

const tiposGastosAdmin = [
  {
    id: "gastos-generales",
    label: "Gastos Generales",
    icon: FileText,
    color: "bg-blue-600",
    description: "Gastos administrativos generales"
  },
  {
    id: "staff-administrativo",
    label: "Staff Administrativo",
    icon: Users,
    color: "bg-green-600",
    description: "Personal administrativo y consultorías"
  },
];

const gastosGeneralesOptions = [
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

interface GastoGeneralItem {
  id: string;
  tipo: string;
  monto: number;
}

interface StaffAdminItem {
  id: string;
  rol: string;
  remuneracion: number;
  cargasSociales: number;
  nroProfesionales: number;
}

interface GastosAdminFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
  existingCosts?: any[];
}

export default function GastosAdminForm({ onSave, onCancel, existingCosts }: GastosAdminFormProps) {
  const [currentStep, setCurrentStep] = useState<'selection' | 'form'>('selection');
  const [selectedType, setSelectedType] = useState<typeof tiposGastosAdmin[0] | null>(null);

  // Estado para gastos generales
  const [gastosGeneralesItems, setGastosGeneralesItems] = useState<GastoGeneralItem[]>([]);

  // Estado para staff administrativo
  const [staffItems, setStaffItems] = useState<StaffAdminItem[]>([]);

  const handleTypeSelect = (tipo: typeof tiposGastosAdmin[0]) => {
    setSelectedType(tipo);
    setCurrentStep('form');

    // Check if there's existing data for this type
    const existingCost = existingCosts?.find(cost =>
      cost.category === 'gastos-admin' &&
      cost.details?.type === tipo.label
    );

    if (existingCost && existingCost.details?.data) {
      // Load existing data
      const existingData = existingCost.details.data;

      if (tipo.id === "gastos-generales" && existingData.items) {
        setGastosGeneralesItems(existingData.items.map((item: any, index: number) => ({
          id: item.id || `gasto_${index + 1}`,
          tipo: item.tipo || "",
          monto: item.monto || 0,
        })));
        setStaffItems([]);
      } else if (tipo.id === "staff-administrativo" && existingData.staff) {
        setStaffItems(existingData.staff.map((item: any, index: number) => ({
          id: item.id || `staff_${index + 1}`,
          rol: item.rol || "",
          remuneracion: item.remuneracion || 0,
          cargasSociales: item.cargasSociales || 30,
          nroProfesionales: item.nroProfesionales || 1,
        })));
        setGastosGeneralesItems([]);
      }
    } else {
      // Initialize with one empty item based on selected type
      if (tipo.id === "gastos-generales") {
        setGastosGeneralesItems([{
          id: `gasto_1`,
          tipo: "",
          monto: 0,
        }]);
        setStaffItems([]);
      } else if (tipo.id === "staff-administrativo") {
        setStaffItems([{
          id: `staff_1`,
          rol: "",
          remuneracion: 0,
          cargasSociales: 30,
          nroProfesionales: 1,
        }]);
        setGastosGeneralesItems([]);
      }
    }
  };

  const handleBack = () => {
    setCurrentStep('selection');
    setSelectedType(null);
    setGastosGeneralesItems([]);
    setStaffItems([]);
  };

  // Funciones para gastos generales
  const addGastoGeneral = () => {
    const nextId = gastosGeneralesItems.length + 1;
    const newItem: GastoGeneralItem = {
      id: `gasto_${nextId}`,
      tipo: "",
      monto: 0,
    };
    setGastosGeneralesItems([...gastosGeneralesItems, newItem]);
  };

  const removeGastoGeneral = (id: string) => {
    setGastosGeneralesItems(gastosGeneralesItems.filter(item => item.id !== id));
  };

  const updateGastoGeneral = (id: string, updates: Partial<GastoGeneralItem>) => {
    setGastosGeneralesItems(gastosGeneralesItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  // Funciones para staff administrativo
  const addStaffItem = () => {
    const nextId = staffItems.length + 1;
    const newItem: StaffAdminItem = {
      id: `staff_${nextId}`,
      rol: "",
      remuneracion: 0,
      cargasSociales: 0,
      nroProfesionales: 1,
    };
    setStaffItems([...staffItems, newItem]);
  };

  const removeStaffItem = (id: string) => {
    setStaffItems(staffItems.filter(item => item.id !== id));
  };

  const updateStaffItem = (id: string, updates: Partial<StaffAdminItem>) => {
    setStaffItems(staffItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  // Calcular totales
  const totalGastosGenerales = gastosGeneralesItems.reduce((sum, item) => sum + item.monto, 0);
  const totalStaff = staffItems.reduce((sum, item) =>
    sum + calcularCostoStaff(item.remuneracion, item.cargasSociales, item.nroProfesionales), 0
  );

  // Obtener roles disponibles (excluyendo los ya seleccionados)
  const getAvailableRoles = () => {
    const selectedRoles = staffItems.map(item => item.rol).filter(rol => rol.trim() !== '');
    return rolesAdmin.filter(role => !selectedRoles.includes(role));
  };

  // Obtener tipos de gastos disponibles (excluyendo los ya seleccionados)
  const getAvailableGastoTypes = () => {
    const selectedTypes = gastosGeneralesItems.map(item => item.tipo).filter(tipo => tipo.trim() !== '');
    return gastosGeneralesOptions.filter(option => !selectedTypes.includes(option.key));
  };

  const handleSave = () => {
    if (!selectedType) return;

    // Check if this type already exists to determine if we need to update
    const existingCost = existingCosts?.find(cost =>
      cost.category === 'gastos-admin' &&
      cost.details?.type === selectedType.label
    );

    if (selectedType.id === "gastos-generales") {
      if (gastosGeneralesItems.length === 0) return;

      // Validate gastos generales items
      for (const item of gastosGeneralesItems) {
        if (!item.tipo || item.tipo.trim() === '') {
          alert('Por favor selecciona un tipo de gasto para todos los items.');
          return;
        }
        if (!item.monto || item.monto <= 0) {
          alert('Por favor ingresa un monto válido mayor a 0 para todos los items.');
          return;
        }
      }

      const costData = {
        category: "gastos-admin",
        details: {
          type: selectedType.label,
          data: {
            items: gastosGeneralesItems,
          },
          breakdown: {
            total_items: gastosGeneralesItems.length,
            total_amount: totalGastosGenerales,
          }
        },
        total_amount: totalGastosGenerales,
        existingId: existingCost?.id, // Include existing ID if updating
      };
      onSave(costData);
    } else if (selectedType.id === "staff-administrativo") {
      if (staffItems.length === 0) return;

      // Validate staff items
      for (const item of staffItems) {
        if (!item.rol || item.rol.trim() === '') {
          alert('Por favor selecciona un rol para todos los miembros del staff.');
          return;
        }
        if (!item.remuneracion || item.remuneracion <= 0) {
          alert('Por favor ingresa una remuneración válida mayor a 0.');
          return;
        }
        if (!item.cargasSociales || item.cargasSociales <= 0) {
          alert('Por favor ingresa cargas sociales válidas mayor a 0.');
          return;
        }
        if (!item.nroProfesionales || item.nroProfesionales <= 0) {
          alert('Por favor ingresa un número válido de profesionales mayor a 0.');
          return;
        }
      }

      const costData = {
        category: "gastos-admin",
        details: {
          type: selectedType.label,
          data: {
            staff: staffItems,
          },
          breakdown: {
            total_staff: staffItems.length,
            total_amount: totalStaff,
          }
        },
        total_amount: totalStaff,
        existingId: existingCost?.id, // Include existing ID if updating
      };
      onSave(costData);
    }
  };

  if (currentStep === 'selection') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Seleccionar Tipo de Gasto Administrativo</h3>
          <p className="text-sm text-muted-foreground">
            Elige el tipo de gasto administrativo que deseas registrar
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {tiposGastosAdmin.map((tipo) => {
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
      {selectedType.id === "gastos-generales" ? (
        <div className="space-y-4">
          {gastosGeneralesItems.map((item) => (
            <div key={item.id} className="p-4 border border-border rounded-lg space-y-3 bg-secondary/30">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  {/* Tipo de gasto */}
                  <div>
                    <Label className="text-xs">Tipo de Gasto</Label>
                    <Select
                      value={item.tipo}
                      onValueChange={(value) => updateGastoGeneral(item.id, { tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo de gasto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableGastoTypes().map((option) => (
                          <SelectItem key={option.key} value={option.key}>
                            {option.label}
                          </SelectItem>
                        ))}
                        {/* Si ya tiene un tipo seleccionado, mostrarlo aunque esté duplicado */}
                        {item.tipo && !getAvailableGastoTypes().find(opt => opt.key === item.tipo) && (
                          <SelectItem value={item.tipo}>
                            {gastosGeneralesOptions.find(opt => opt.key === item.tipo)?.label || item.tipo}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Monto */}
                  <div>
                    <Label className="text-xs">Monto Anual</Label>
                    <CurrencyInput
                      value={item.monto || ""}
                      onChange={(value) => updateGastoGeneral(item.id, { monto: value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive ml-2"
                  onClick={() => removeGastoGeneral(item.id)}
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
            onClick={addGastoGeneral}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Gasto General
          </Button>

          {/* Total display */}
          {totalGastosGenerales > 0 && (
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Gastos Generales:</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(totalGastosGenerales, true)}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {staffItems.map((item) => (
            <div key={item.id} className="p-4 border border-border rounded-lg space-y-3 bg-secondary/30">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  {/* Rol */}
                  <div>
                    <Label className="text-xs">Rol/Puesto</Label>
                    <Select
                      value={item.rol}
                      onValueChange={(value) => updateStaffItem(item.id, { rol: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableRoles().map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                        {/* Si ya tiene un rol seleccionado, mostrarlo aunque esté duplicado */}
                        {item.rol && !getAvailableRoles().includes(item.rol) && (
                          <SelectItem value={item.rol}>
                            {item.rol}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Remuneración and Cargas Sociales */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Remuneración Anual</Label>
                      <CurrencyInput
                        value={item.remuneracion || ""}
                        onChange={(value) => updateStaffItem(item.id, { remuneracion: value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Cargas Sociales (%)</Label>
                      <Input
                        type="number"
                        value={item.cargasSociales || ""}
                        onChange={(e) => updateStaffItem(item.id, { cargasSociales: parseFloat(e.target.value) || 0 })}
                        placeholder="30"
                      />
                    </div>
                  </div>

                  {/* Número de profesionales */}
                  <div>
                    <Label className="text-xs">Número de Profesionales</Label>
                    <Input
                      type="number"
                      value={item.nroProfesionales || ""}
                      onChange={(e) => updateStaffItem(item.id, { nroProfesionales: parseInt(e.target.value) || 1 })}
                      placeholder="1"
                      min="1"
                    />
                  </div>

                  {/* Cost calculation display */}
                  <div className="flex justify-end pt-2 border-t border-border">
                    <span className="font-semibold text-primary">
                      Costo Anual: {formatCurrency(calcularCostoStaff(
                        item.remuneracion,
                        item.cargasSociales,
                        item.nroProfesionales
                      ), true)}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive ml-2"
                  onClick={() => removeStaffItem(item.id)}
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
            onClick={addStaffItem}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Staff
          </Button>

          {/* Total display */}
          {totalStaff > 0 && (
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Staff Administrativo:</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(totalStaff, true)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
          Atrás
        </Button>
        <Button
          onClick={handleSave}
          className="flex-1"
          disabled={
            (selectedType.id === "gastos-generales" && gastosGeneralesItems.length === 0) ||
            (selectedType.id === "staff-administrativo" && staffItems.length === 0)
          }
        >
          Guardar
        </Button>
      </div>
    </div>
  );
}
