import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/contexts/AppContext";
import { createProject } from "@/services/projectService";
import { ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";

const Onboarding = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [initialYear, setInitialYear] = useState("");
  const [pais, setPais] = useState("Argentina");
  const [provincia, setProvincia] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [allowBenchmarking, setAllowBenchmarking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleStart = () => {
    setStep(1);
  };

  const handleNext = () => {
    if (step === 1 && projectName && initialYear) {
      setStep(2);
    } else if (step === 2 && pais && provincia && (pais !== "Argentina" || (departamento && municipio))) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleFinish = async () => {
    if (!initialYear || !pais || !provincia || (pais === "Argentina" && (!departamento || !municipio)) || !allowBenchmarking) return;

    setIsCreating(true);
    setError(null);

    const finalProjectName = projectName || "Proyecto 1";

    try {
      // Create the project
      const projectData = {
        project_name: finalProjectName,
        description: descripcion,
        pais,
        provincia,
        departamento,
        municipio,
        allow_benchmarking: allowBenchmarking ? 1 : 0,
      };

      const createdProject = await createProject(projectData);
      const projectId = createdProject.id;

      // Complete onboarding with project ID to create campaigns
      await completeOnboarding(finalProjectName, parseInt(initialYear), projectId);

      navigate("/montes");
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Error al crear el proyecto. Por favor, inténtalo de nuevo.');
    } finally {
      setIsCreating(false);
    }
  };

  if (step === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full border-border/50 shadow-xl">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-4xl font-bold text-foreground mb-4">
              Configura tu Proyecto
            </CardTitle>
            <p className="text-lg text-muted-foreground">
              Para que puedas empezar a registrar los datos de tus campañas primero defini las bases de tu proyecto.
            </p>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button
              onClick={handleStart}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-8 py-6 text-lg"
            >
              Comenzar
              <ChevronRight className="h-6 w-6" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-foreground">
              Paso 1: Las Bases
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="projectName" className="text-base font-medium">
                Nombre del proyecto
              </Label>
              <Input
                id="projectName"
                placeholder="Finca Los Arroyos"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-lg py-6"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initialYear" className="text-base font-medium">
                Año/Campaña inicial
              </Label>
              <Select value={initialYear} onValueChange={setInitialYear}>
                <SelectTrigger className="text-lg py-6">
                  <SelectValue placeholder="Selecciona un año" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: new Date().getFullYear() - 1990 + 1 }, (_, i) => 1990 + i).reverse().map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between pt-4">
              <Button
                onClick={() => setStep(0)}
                variant="outline"
                className="gap-2 px-6 py-6"
              >
                <ChevronLeft className="h-5 w-5" />
                Volver
              </Button>
              <Button
                onClick={handleNext}
                disabled={!projectName || !initialYear}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-6 py-6"
              >
                Siguiente
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-foreground">
              Paso 2: Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pais" className="text-base font-medium">
                País
              </Label>
              <Select value={pais} onValueChange={setPais}>
                <SelectTrigger className="text-lg py-6">
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
                  <Label htmlFor="provincia" className="text-base font-medium">
                    Provincia
                  </Label>
                  <Select
                    value={provincia}
                    onValueChange={(value) => {
                      setProvincia(value);
                      setDepartamento("");
                    }}
                  >
                    <SelectTrigger className="text-lg py-6">
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
                  <Label htmlFor="departamento" className="text-base font-medium">
                    Departamento
                  </Label>
                  <Select
                    value={departamento}
                    onValueChange={(value) => {
                      setDepartamento(value);
                      setMunicipio("");
                    }}
                    disabled={!provincia}
                  >
                    <SelectTrigger className="text-lg py-6">
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
                  <Label htmlFor="municipio" className="text-base font-medium">
                    Municipio
                  </Label>
                  <Select
                    value={municipio}
                    onValueChange={setMunicipio}
                    disabled={!departamento}
                  >
                    <SelectTrigger className="text-lg py-6">
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
                <Label htmlFor="provincia" className="text-base font-medium">
                  Provincia / Región
                </Label>
                <Input
                  id="provincia"
                  placeholder="Ej: São Paulo"
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                  className="text-lg py-6"
                />
              </div>
            )}
            <div className="flex justify-between pt-4">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="gap-2 px-6 py-6"
              >
                <ChevronLeft className="h-5 w-5" />
                Volver
              </Button>
              <Button
                onClick={handleNext}
                disabled={!pais || !provincia || (pais === "Argentina" && (!departamento || !municipio))}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-6 py-6"
              >
                Siguiente
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-foreground">
              Paso 3: Descripción
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="descripcion" className="text-base font-medium">
                Descripción del Proyecto
              </Label>
              <Textarea
                id="descripcion"
                placeholder="Breve descripción del proyecto"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="text-lg min-h-[100px]"
              />
            </div>
            <div className="flex justify-between pt-4">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="gap-2 px-6 py-6"
              >
                <ChevronLeft className="h-5 w-5" />
                Volver
              </Button>
              <Button
                onClick={handleNext}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-6 py-6"
              >
                Siguiente
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-foreground">
              Paso 4: Revisión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-secondary/20 rounded-lg p-6 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Proyecto:</p>
                <p className="text-xl font-semibold text-foreground">{projectName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Año/Campaña inicial:</p>
                <p className="text-xl font-semibold text-foreground">{initialYear}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">País:</p>
                <p className="text-xl font-semibold text-foreground">{pais}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Provincia:</p>
                <p className="text-xl font-semibold text-foreground">{provincia}</p>
              </div>
              {pais === "Argentina" && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Departamento:</p>
                    <p className="text-xl font-semibold text-foreground">{departamento}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Municipio:</p>
                    <p className="text-xl font-semibold text-foreground">{municipio}</p>
                  </div>
                </>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Descripción:</p>
                <p className="text-lg text-foreground">{descripcion}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowBenchmarking"
                  checked={allowBenchmarking}
                  onChange={(e) => setAllowBenchmarking(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="allowBenchmarking" className="text-sm font-medium">
                  He leído y acepto las políticas de privacidad
                </Label>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                onClick={() => setStep(3)}
                variant="outline"
                className="gap-2 px-6 py-6"
              >
                <ChevronLeft className="h-5 w-5" />
                Volver
              </Button>
              <Button
                onClick={handleFinish}
                disabled={isCreating || !allowBenchmarking}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-6 py-6"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creando proyecto...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Crear proyecto
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default Onboarding;
