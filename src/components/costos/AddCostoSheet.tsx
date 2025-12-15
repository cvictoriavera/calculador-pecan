import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Beaker,
  Fuel,
  Users,
  Zap,
  Wheat,
  FileText,
  Wrench,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import InsumosForm from "./forms/InsumosForm";
import CombustibleForm from "./forms/CombustibleForm";
import ManoObraForm from "./forms/ManoObraForm";
import EnergiaForm from "./forms/EnergiaForm";
import CosechaForm from "./forms/CosechaForm";
import GastosAdminForm from "./forms/GastosAdminForm";
import MantenimientosForm from "./forms/MantenimientosForm";
import CostosOportunidadForm from "./forms/CostosOportunidadForm";

const categorias = [
  { id: "insumos", label: "Insumos (Agroquímicos)", icon: Beaker, color: "bg-primary/10 text-primary" },
  { id: "combustible", label: "Combustible", icon: Fuel, color: "bg-warning/10 text-warning" },
  { id: "mano-obra", label: "Mano de Obra", icon: Users, color: "bg-cocoa/10 text-cocoa" },
  { id: "energia", label: "Energía Eléctrica", icon: Zap, color: "bg-camel/10 text-camel" },
  { id: "cosecha", label: "Cosecha y Poscosecha", icon: Wheat, color: "bg-primary/10 text-primary", disabled: true },
  { id: "gastos-admin", label: "Gastos Administrativos", icon: FileText, color: "bg-muted-foreground/10 text-muted-foreground" },
  { id: "mantenimientos", label: "Mantenimientos", icon: Wrench, color: "bg-cocoa/10 text-cocoa" },
  { id: "costos-oportunidad", label: "Costos de Oportunidad", icon: TrendingUp, color: "bg-warning/10 text-warning" },
];

const categoriaLabelToId: Record<string, string> = {
  "Insumos": "insumos",
  "Combustible": "combustible",
  "Mano de Obra": "mano-obra",
  "Energía": "energia",
  "Cosecha": "cosecha",
  "Administración": "gastos-admin",
  "Mantenimientos": "mantenimientos",
  "Oportunidad": "costos-oportunidad",
};

interface CostoRegistro {
  id: number;
  project_id: number;
  campaign_id: number;
  category: string;
  details?: any;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

interface AddCostoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (categoria: string, data: any) => void;
  editingCosto?: CostoRegistro | null;
  existingCosts?: CostoRegistro[];
}

export default function AddCostoSheet({ open, onOpenChange, onSave, editingCosto, existingCosts = [] }: AddCostoSheetProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [existingCostoForCategory, setExistingCostoForCategory] = useState<CostoRegistro | null>(null);

  useEffect(() => {
    if (editingCosto && open) {
      const categoryId = categoriaLabelToId[editingCosto.category];
      if (categoryId) {
        setSelectedCategory(categoryId);
      }
    }
  }, [editingCosto, open]);

  const handleClose = () => {
    setSelectedCategory(null);
    setExistingCostoForCategory(null);
    onOpenChange(false);
  };

  // Función para manejar la selección de categoría
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);

    // Para categorías sin subtipos, buscar si ya existe un registro
    if (!hasSubtypes(categoryId)) {
      const existing = findExistingCosto(categoryId);
      setExistingCostoForCategory(existing);
    } else {
      setExistingCostoForCategory(null);
    }
  };

  const handleBack = () => {
    if (editingCosto) {
      handleClose();
    } else {
      setSelectedCategory(null);
      setExistingCostoForCategory(null);
    }
  };

  const handleSave = (data: any) => {
    if (selectedCategory) {
      // Si estamos editando un registro existente, incluir el ID para actualizarlo
      if (existingCostoForCategory) {
        onSave(selectedCategory, { ...data, existingId: existingCostoForCategory.id });
      } else {
        onSave(selectedCategory, data);
      }
      handleClose();
    }
  };

  // Determinar si una categoría tiene subtipos internos
  const hasSubtypes = (category: string) => {
    return ['insumos', 'combustible', 'energia', 'gastos-admin'].includes(category);
  };

  // Buscar registro existente para una categoría
  const findExistingCosto = (category: string) => {
    return existingCosts.find(costo => costo.category === category) || null;
  };

  const getInitialData = () => {
    if (editingCosto?.details) return editingCosto.details;
    if (existingCostoForCategory?.details) return existingCostoForCategory.details;
    return undefined;
  };

  const renderForm = () => {
    const initialData = getInitialData();

    switch (selectedCategory) {
      case "insumos":
        return <InsumosForm onSave={handleSave} onCancel={handleBack} initialData={initialData} existingCosts={existingCosts} />;
      case "combustible":
        return <CombustibleForm onSave={handleSave} onCancel={handleBack} initialData={initialData} existingCosts={existingCosts} />;
      case "mano-obra":
        return <ManoObraForm onSave={handleSave} onCancel={handleBack} initialData={initialData} existingCosts={existingCosts} />;
      case "energia":
        return <EnergiaForm onSave={handleSave} onCancel={handleBack} initialData={initialData} existingCosts={existingCosts} />;
      case "cosecha":
        return <CosechaForm onSave={handleSave} onCancel={handleBack} initialData={initialData} existingCosts={existingCosts} />;
      case "gastos-admin":
        return <GastosAdminForm onSave={handleSave} onCancel={handleBack} initialData={initialData} existingCosts={existingCosts} />;
      case "mantenimientos":
        return <MantenimientosForm onSave={handleSave} onCancel={handleBack} initialData={initialData} existingCosts={existingCosts} />;
      case "costos-oportunidad":
        return <CostosOportunidadForm onSave={handleSave} onCancel={handleBack} initialData={initialData} existingCosts={existingCosts} />;
      default:
        return null;
    }
  };

  const selectedCat = categorias.find((c) => c.id === selectedCategory);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader className="flex-shrink-0">
          {selectedCategory ? (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                {selectedCat && (
                  <div className={`p-2 rounded-lg ${selectedCat.color}`}>
                    <selectedCat.icon className="h-5 w-5" />
                  </div>
                )}
                <SheetTitle>{selectedCat?.label}</SheetTitle>
              </div>
            </div>
          ) : (
            <SheetTitle>{editingCosto ? "Editar Costo Operativo" : "Nuevo Costo Operativo"}</SheetTitle>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {!selectedCategory ? (
            <div className="space-y-3 py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Selecciona la categoría de costo que deseas registrar:
              </p>
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => !cat.disabled && handleCategorySelect(cat.id)}
                  disabled={cat.disabled}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-colors text-left ${
                    cat.disabled
                      ? "border-border/50 bg-secondary/20 text-muted-foreground cursor-not-allowed opacity-60"
                      : "border-border hover:bg-secondary/50 text-foreground"
                  }`}
                >
                  <div className={`p-3 rounded-lg ${cat.disabled ? "bg-muted" : cat.color}`}>
                    <cat.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <span className={`font-medium ${cat.disabled ? "text-muted-foreground" : "text-foreground"}`}>
                      {cat.label}
                    </span>
                    {cat.disabled && (
                      <span className="block text-xs text-muted-foreground mt-1">
                        En reparación de errores
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-4">{renderForm()}</div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
