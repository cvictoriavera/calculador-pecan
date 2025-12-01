import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";

export function AddMonteDialog() {
  const { addMonte } = useApp();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [hectareas, setHectareas] = useState("");
  const [densidad, setDensidad] = useState("");
  const [añoPlantacion, setAñoPlantacion] = useState("");
  const [variedad, setVariedad] = useState("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const handleSubmit = () => {
    if (!hectareas || !densidad || !añoPlantacion || !variedad) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    const monteNombre = nombre || `Monte ${Math.random().toString(36).substr(2, 9)}`;

    addMonte({
      nombre: monteNombre,
      hectareas: parseFloat(hectareas),
      densidad: parseFloat(densidad),
      añoPlantacion: parseInt(añoPlantacion),
      variedad,
    });

    toast.success("Monte agregado exitosamente");
    setOpen(false);
    setNombre("");
    setHectareas("");
    setDensidad("");
    setAñoPlantacion("");
    setVariedad("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="h-5 w-5" />
          Agregar Monte
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Nuevo Monte</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre (Opcional)</Label>
            <Input
              id="nombre"
              placeholder="Monte A"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hectareas">Área (Ha) *</Label>
            <Input
              id="hectareas"
              type="number"
              step="0.1"
              placeholder="50"
              value={hectareas}
              onChange={(e) => setHectareas(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="densidad">Densidad (Plantas/Ha) *</Label>
            <Input
              id="densidad"
              type="number"
              placeholder="100"
              value={densidad}
              onChange={(e) => setDensidad(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="añoPlantacion">Año de Plantación *</Label>
            <Select value={añoPlantacion} onValueChange={setAñoPlantacion}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar año" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="variedad">Variedad *</Label>
            <Select value={variedad} onValueChange={setVariedad}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar variedad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pawnee">Pawnee</SelectItem>
                <SelectItem value="Wichita">Wichita</SelectItem>
                <SelectItem value="Western">Western</SelectItem>
                <SelectItem value="Stuart">Stuart</SelectItem>
                <SelectItem value="Desirable">Desirable</SelectItem>
                <SelectItem value="Otras">Otras</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Agregar Monte
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
