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
  { id: "cosecha", label: "Cosecha y Poscosecha", icon: Wheat, color: "bg-primary/10 text-primary" },
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
  id: string;
  categoria: string;
  descripcion: string;
  monto: number;
  año: number;
  data?: any;
}

interface AddCostoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (categoria: string, data: any) => void;
  editingCosto?: CostoRegistro | null;
}

export default function AddCostoSheet({ open, onOpenChange, onSave, editingCosto }: AddCostoSheetProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (editingCosto && open) {
      const categoryId = categoriaLabelToId[editingCosto.categoria];
      if (categoryId) {
        setSelectedCategory(categoryId);
      }
    }
  }, [editingCosto, open]);

  const handleClose = () => {
    setSelectedCategory(null);
    onOpenChange(false);
  };

  const handleBack = () => {
    if (editingCosto) {
      handleClose();
    } else {
      setSelectedCategory(null);
    }
  };

  const handleSave = (data: any) => {
    if (selectedCategory) {
      onSave(selectedCategory, data);
      handleClose();
    }
  };

  const getInitialData = () => {
    if (!editingCosto?.data) return undefined;
    return editingCosto.data;
  };

  const renderForm = () => {
    const initialData = getInitialData();
    
    switch (selectedCategory) {
      case "insumos":
        return <InsumosForm onSave={handleSave} onCancel={handleBack} />;
      case "combustible":
        return <CombustibleForm onSave={handleSave} onCancel={handleBack} />;
      case "mano-obra":
        return <ManoObraForm onSave={handleSave} onCancel={handleBack} />;
      case "energia":
        return <EnergiaForm onSave={handleSave} onCancel={handleBack} />;
      case "cosecha":
        return <CosechaForm onSave={handleSave} onCancel={handleBack} initialData={initialData} />;
      case "gastos-admin":
        return <GastosAdminForm onSave={handleSave} onCancel={handleBack} />;
      case "mantenimientos":
        return <MantenimientosForm onSave={handleSave} onCancel={handleBack} initialData={initialData} />;
      case "costos-oportunidad":
        return <CostosOportunidadForm onSave={handleSave} onCancel={handleBack} initialData={initialData} />;
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
                  onClick={() => setSelectedCategory(cat.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className={`p-3 rounded-lg ${cat.color}`}>
                    <cat.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-foreground">{cat.label}</span>
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
