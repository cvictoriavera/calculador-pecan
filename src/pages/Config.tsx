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
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const { toast } = useToast();
  const { initialYear, currentProjectId, projects } = useApp();

  const isTrialMode = () => localStorage.getItem('isTrialMode') === 'true';

  const [pais, setPais] = useState("Argentina");
  const [provincia, setProvincia] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [añoInicio, setAñoInicio] = useState(initialYear || 2020);

  const [geoData, setGeoData] = useState<{
    provinces: string[];
    departments: { [province: string]: string[] };
    municipalities: { [key: string]: string[] };
  }>({
    provinces: [],
    departments: {},
    municipalities: {},
  });


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setProducerName(user.name || "");
        setUserRoles(user.roles || []);
      } catch (error) {
        console.error("Error fetching user:", error);
        // Fallback to empty or default
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const loadGeoData = async () => {
      try {
        // Dynamic import to load only when needed
        const data = await import('../../public/geo-argentina.json');

        const provincesSet = new Set<string>();
        const departmentsMap: { [province: string]: Set<string> } = {};
        const municipalitiesMap: { [key: string]: Set<string> } = {};

        data.default.localidades_censales.forEach((loc: any) => {
          const province = loc.provincia.nombre;
          const department = loc.departamento.nombre;
          const municipality = loc.nombre;

          provincesSet.add(province);

          if (!departmentsMap[province]) {
            departmentsMap[province] = new Set();
          }
          departmentsMap[province].add(department);

          const key = `${province}-${department}`;
          if (!municipalitiesMap[key]) {
            municipalitiesMap[key] = new Set();
          }
          municipalitiesMap[key].add(municipality);
        });

        const provinces = Array.from(provincesSet).sort();
        const departments: { [province: string]: string[] } = {};
        const municipalities: { [key: string]: string[] } = {};

        Object.keys(departmentsMap).forEach(prov => {
          departments[prov] = Array.from(departmentsMap[prov]).sort();
        });

        Object.keys(municipalitiesMap).forEach(key => {
          municipalities[key] = Array.from(municipalitiesMap[key]).sort();
        });

        setGeoData({
          provinces,
          departments,
          municipalities,
        });
      } catch (error) {
        console.error("Error loading geo data:", error);
      }
    };

    if (pais === "Argentina") {
      loadGeoData();
    } else {
      // Clear geo data if not Argentina
      setGeoData({
        provinces: [],
        departments: {},
        municipalities: {},
      });
    }
  }, [pais]);

  useEffect(() => {
    if (currentProjectId && projects.length > 0) {
      const currentProject = projects.find(p => p.id === currentProjectId);
      if (currentProject) {
        setPais(currentProject.pais || "Argentina");
        setProvincia(currentProject.provincia || "");
        setDepartamento(currentProject.departamento || "");
        setMunicipio(currentProject.municipio || "");
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
        provincia,
        departamento,
        municipio,
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
        <h1 className="text-3xl mb-2">Configuración</h1>
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

          {!isTrialMode() && (
            <>
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

              {pais === "Argentina" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="provincia">Provincia</Label>
                    <Select
                      value={provincia}
                      onValueChange={(value) => {
                        setProvincia(value);
                        setDepartamento("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una provincia" />
                      </SelectTrigger>
                      <SelectContent>
                        {geoData.provinces.map((prov) => (
                          <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="departamento">Departamento</Label>
                    <Select
                      value={departamento}
                      onValueChange={(value) => {
                        setDepartamento(value);
                        setMunicipio("");
                      }}
                      disabled={!provincia}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {provincia && geoData.departments[provincia]?.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="municipio">Municipio</Label>
                    <Select
                      value={municipio}
                      onValueChange={setMunicipio}
                      disabled={!departamento}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un municipio" />
                      </SelectTrigger>
                      <SelectContent>
                        {departamento && provincia && geoData.municipalities[`${provincia}-${departamento}`]?.map((mun) => (
                          <SelectItem key={mun} value={mun}>{mun}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="provincia">Provincia / Región</Label>
                  <Input
                    id="provincia"
                    placeholder="Ej: São Paulo"
                    value={provincia}
                    onChange={(e) => setProvincia(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

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
            <Select value={añoInicio.toString()} onValueChange={(value) => setAñoInicio(parseInt(value))} disabled={isTrialMode()}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un año" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: (initialYear || new Date().getFullYear()) - 1990 + 1 }, (_, i) => 1990 + i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isTrialMode() && (
              <p className="text-sm text-muted-foreground">
                No puedes cambiar el año de inicio en modo prueba.
              </p>
            )}
          </div>

          {!isTrialMode() && (
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Save className="h-5 w-5" />
              Cambiar año de inicio
            </Button>
          )}
        </CardContent>
      </Card>

      {userRoles.includes('administrator') && (
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
      )}

    </div>
  );
};

export default Config;
