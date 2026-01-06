import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, Database } from "lucide-react";
import { getCurrentUser } from "@/services/userService";
import { apiRequest } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const Config = () => {
  const [producerName, setProducerName] = useState("");
  const [isMigrating, setIsMigrating] = useState(false);
  const { toast } = useToast();

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
              onChange={(e) => setProducerName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="año-inicio">Año de Inicio de Registros</Label>
            <Input id="año-inicio" type="number" placeholder="Ej: 2005" defaultValue="2020" />
          </div>

          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 mt-4">
            <Save className="h-5 w-5" />
            Guardar Cambios
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
