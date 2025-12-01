import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useApp } from "@/contexts/AppContext";
import type { Monte } from "@/contexts/AppContext";
import { toast } from "sonner";

interface EditMonteDialogProps {
  monte: Monte;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMonteDialog({ monte, open, onOpenChange }: EditMonteDialogProps) {
  const { updateMonte } = useApp();
  const [nombre, setNombre] = useState(monte.nombre);
  const [hectareas, setHectareas] = useState(monte.hectareas.toString());
  const [densidad, setDensidad] = useState(monte.densidad.toString());
  const [añoPlantacion, setAñoPlantacion] = useState(monte.añoPlantacion.toString());
  const [variedad, setVariedad] = useState(monte.variedad);

  useEffect(() => {
    setNombre(monte.nombre);
    setHectareas(monte.hectareas.toString());
    setDensidad(monte.densidad.toString());
    setAñoPlantacion(monte.añoPlantacion.toString());
    setVariedad(monte.variedad);
  }, [monte]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const handleSubmit = () => {
    if (!nombre || !hectareas || !densidad || !añoPlantacion || !variedad) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    updateMonte(monte.id, {
      nombre,
      hectareas: parseFloat(hectareas),
      densidad: parseFloat(densidad),
      añoPlantacion: parseInt(añoPlantacion),
      variedad,
    });

    toast.success("Monte actualizado exitosamente");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Monte</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              placeholder="Monte A"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hectareas">Área (Ha)</Label>
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
            <Label htmlFor="densidad">Densidad (Plantas/Ha)</Label>
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
            <Label htmlFor="añoPlantacion">Año de Plantación</Label>
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
            <Label htmlFor="variedad">Variedad</Label>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Guardar Cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
