import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";

const Config = () => {
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
            <Input id="nombre-productor" placeholder="Ej: Juan Pérez" defaultValue="Juan Pérez" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area-total">Área Total de Tierra (hectáreas)</Label>
            <Input id="area-total" type="number" placeholder="Ej: 250" defaultValue="250" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="año-inicio">Año de Inicio de Registros</Label>
            <Input id="año-inicio" type="number" placeholder="Ej: 2005" defaultValue="2020" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="moneda">Moneda Preferida</Label>
            <Input id="moneda" placeholder="Ej: USD, ARS" defaultValue="USD" />
          </div>

          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 mt-4">
            <Save className="h-5 w-5" />
            Guardar Cambios
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-foreground">Configuración de Campañas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaña-actual">Campaña Actual</Label>
            <Input id="campaña-actual" type="number" placeholder="Ej: 2025" defaultValue="2025" />
          </div>

          <p className="text-sm text-muted-foreground">
            Esta campaña se seleccionará por defecto al ingresar a la aplicación.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-foreground">Precios de Referencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="precio-venta">Precio de Venta Promedio (por kg)</Label>
            <Input id="precio-venta" type="number" placeholder="Ej: 70" defaultValue="70" />
          </div>

          <p className="text-sm text-muted-foreground">Este precio se usará como valor predeterminado.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Config;
