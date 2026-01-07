import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Save, Database } from "lucide-react";
import { getCurrentUser } from "@/services/userService";
import { apiRequest } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";
import { updateProject } from "@/services/projectService";

const Config = () => {
  const [producerName, setProducerName] = useState("");
  const [isMigrating, setIsMigrating] = useState(false);
  const { toast } = useToast();
  const { initialYear, currentProjectId, projects } = useApp();

  const [pais, setPais] = useState("Argentina");
  const [region, setRegion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [añoInicio, setAñoInicio] = useState(initialYear || 2020);

  const provinciasArgentina = [
    "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes",
    "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza",
    "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis",
    "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setProducerName(user.name || "");
      } catch (error) {
        console.error("Error fetching user:", error);
        // Fallback to empty or default
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (currentProjectId && projects.length > 0) {
      const currentProject = projects.find(p => p.id === currentProjectId);
      if (currentProject) {
        setPais(currentProject.pais || "Argentina");
        setRegion(currentProject.region || "");
        setDescripcion(currentProject.description || "");
      }
    }
  }, [currentProjectId, projects]);

  const handleSave = async () => {
    if (!currentProjectId) {
      toast({
        title: "Error",
        description: "No hay proyecto seleccionado.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateProject(currentProjectId, {
        pais,
        region,
        description: descripcion,
      });
      toast({
        title: "Éxito",
        description: "Los cambios han sido guardados.",
      });
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive",
      });
    }
  };

  const handleMigrateProduction = async () => {
    if (!confirm("¿Estás seguro de que quieres migrar los datos de producción? Esta acción no se puede deshacer.")) {
      return;
    }

    setIsMigrating(true);
    try {
      const result = await apiRequest('ccp/v1/database/migrate-production', {
        method: 'POST',
      });

      if (result.success) {
        toast({
          title: "Migración exitosa",
          description: result.message,
        });
      } else {
        toast({
          title: "Error en la migración",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error migrating production data:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al ejecutar la migración.",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Configuración</h1>
        <p className="text-muted-foreground">Ajustes generales de la aplicación</p>
      </div>

      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-accent" />
            <CardTitle className="text-foreground">Información General</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre-productor">Nombre del Productor</Label>
            <Input
              id="nombre-productor"
              placeholder="Ej: Juan Pérez"
              value={producerName}
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pais">País</Label>
            <Select value={pais} onValueChange={setPais}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un país" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Argentina">Argentina</SelectItem>
                <SelectItem value="Brasil">Brasil</SelectItem>
                <SelectItem value="Uruguay">Uruguay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="provincia">Provincia / Región</Label>
            {pais === "Argentina" ? (
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una provincia" />
                </SelectTrigger>
                <SelectContent>
                  {provinciasArgentina.map((prov) => (
                    <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="region"
                placeholder="Ej: São Paulo"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción del Proyecto</Label>
            <Textarea
              id="descripcion"
              placeholder="Breve descripción del proyecto"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>


          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 mt-4">
            <Save className="h-5 w-5" />
            Guardar Cambios
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-accent" />
            <CardTitle className="text-foreground">Año de Inicio de Registros</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="año-inicio">Año de Inicio de Registros</Label>
            <Select value={añoInicio.toString()} onValueChange={(value) => setAñoInicio(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un año" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: (initialYear || new Date().getFullYear()) - 1990 + 1 }, (_, i) => 1990 + i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Save className="h-5 w-5" />
            Cambiar año de inicio
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-accent" />
            <CardTitle className="text-foreground">Operaciones de Base de Datos</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Migra los datos de producción almacenados en JSON en la tabla campaigns a la nueva tabla productions.
            </p>
            <Button
              onClick={handleMigrateProduction}
              disabled={isMigrating}
              variant="outline"
              className="gap-2"
            >
              {isMigrating ? "Migrando..." : "Migrar Datos de Producción"}
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default Config;
