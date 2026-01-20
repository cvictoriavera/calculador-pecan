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

interface AddMonteDialogProps {
  disabled?: boolean;
}

export function AddMonteDialog({ disabled = false }: AddMonteDialogProps = {}) {
  const { addMonte, montes } = useApp();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [hectareas, setHectareas] = useState("");
  const [densidad, setDensidad] = useState("");
  const [añoPlantacion, setAñoPlantacion] = useState("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const generateNextMonteName = () => {
    // Get existing monte names that start with "Monte "
    const monteNames = montes
      .map(m => m.nombre)
      .filter(name => name.startsWith('Monte '))
      .map(name => name.replace('Monte ', ''));

    // Find the next available letter
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i];
      if (!monteNames.includes(letter)) {
        return `Monte ${letter}`;
      }
    }

    // If all single letters are used, start with AA, AB, etc.
    let index = 0;
    while (true) {
      const letter1 = letters[Math.floor(index / 26)];
      const letter2 = letters[index % 26];
      const combo = letter1 + letter2;
      if (!monteNames.includes(combo)) {
        return `Monte ${combo}`;
      }
      index++;
      if (index > 26 * 26) break; // Prevent infinite loop
    }

    // Fallback
    return `Monte ${Date.now()}`;
  };

  const handleSubmit = async () => {
    if (!hectareas || !densidad || !añoPlantacion) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      const monteNombre = nombre || generateNextMonteName();

      await addMonte({
        nombre: monteNombre,
        hectareas: parseFloat(hectareas),
        densidad: parseFloat(densidad),
        añoPlantacion: parseInt(añoPlantacion),
      });

      toast.success("Monte agregado exitosamente");
      setOpen(false);
      setNombre("");
      setHectareas("");
      setDensidad("");
      setAñoPlantacion("");
    } catch (error) {
      console.error('Error adding monte:', error);
      toast.error("Error al agregar el monte");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={disabled}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
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
