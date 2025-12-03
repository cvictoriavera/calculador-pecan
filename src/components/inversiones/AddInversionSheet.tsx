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
  MapPin,
  Home,
  TreePine,
  Droplets,
  Cog,
  ArrowLeft,
} from "lucide-react";
import TierraForm from "./forms/TierraForm";
import MejorasForm from "./forms/MejorasForm";
import ImplantacionForm from "./forms/ImplantacionForm";
import RiegoForm from "./forms/RiegoForm";
import MaquinariaForm from "./forms/MaquinariaForm";

const categorias = [
  { id: "tierra", label: "Tierra", icon: MapPin, color: "bg-cocoa/10 text-cocoa" },
  { id: "mejoras", label: "Mejoras", icon: Home, color: "bg-camel/10 text-camel" },
  { id: "implantacion", label: "Implantación de monte", icon: TreePine, color: "bg-primary/10 text-primary" },
  { id: "riego", label: "Sistema de Riego", icon: Droplets, color: "bg-accent/10 text-accent" },
  { id: "maquinaria", label: "Máquinas, implementos y herramientas", icon: Cog, color: "bg-warning/10 text-warning" },
];

const categoriaLabelToId: Record<string, string> = {
  "Tierra": "tierra",
  "Mejoras": "mejoras",
  "Implantación": "implantacion",
  "Riego": "riego",
  "Maquinaria": "maquinaria",
};

interface InversionRegistro {
  id: number;
  año: number;
  categoria: string;
  descripcion: string;
  monto: number;
  data?: any;
}

interface AddInversionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (categoria: string, data: any) => void;
  editingInversion?: InversionRegistro | null;
}

export default function AddInversionSheet({ open, onOpenChange, onSave, editingInversion }: AddInversionSheetProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (editingInversion && open) {
      const categoryId = categoriaLabelToId[editingInversion.categoria];
      if (categoryId) {
        setSelectedCategory(categoryId);
      }
    }
  }, [editingInversion, open]);

  const handleClose = () => {
    setSelectedCategory(null);
    onOpenChange(false);
  };

  const handleBack = () => {
    if (editingInversion) {
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
    if (!editingInversion?.data) return undefined;
    return editingInversion.data;
  };

  const renderForm = () => {
    const initialData = getInitialData();
    
    switch (selectedCategory) {
      case "tierra":
        return <TierraForm onSave={handleSave} onCancel={handleBack} initialData={initialData} />;
      case "mejoras":
        return <MejorasForm onSave={handleSave} onCancel={handleBack} initialData={initialData} />;
      case "implantacion":
        return <ImplantacionForm onSave={handleSave} onCancel={handleBack} initialData={initialData} />;
      case "riego":
        return <RiegoForm onSave={handleSave} onCancel={handleBack} initialData={initialData} />;
      case "maquinaria":
        return <MaquinariaForm onSave={handleSave} onCancel={handleBack} initialData={initialData} />;
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
            <SheetTitle>{editingInversion ? "Editar Inversión" : "Nueva Inversión"}</SheetTitle>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {!selectedCategory ? (
            <div className="space-y-3 py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Selecciona la categoría de inversión que deseas registrar:
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
