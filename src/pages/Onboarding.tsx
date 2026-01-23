import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { createProject } from "@/services/projectService";
import { ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";
import { ProjectCreationForm } from "@/components/ProjectCreationForm";
import { useProjectForm } from "@/hooks/useProjectForm";
import type { ProjectFormData } from "@/types/project";

const Onboarding = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useApp();
  const [modalOpen, setModalOpen] = useState(true);
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

  const isTrialMode = () => localStorage.getItem('isTrialMode') === 'true';

  // Use the new hook for geo data management
  const { geoData, loadGeoDataForCountry } = useProjectForm();

  // Create formData object from existing state
  const formData: ProjectFormData = {
    projectName,
    initialYear,
    pais,
    provincia,
    departamento,
    municipio,
    descripcion,
    allowBenchmarking,
  };

  // Handler for form data changes
  const handleFormDataChange = (updates: Partial<ProjectFormData>) => {
    if (updates.projectName !== undefined) setProjectName(updates.projectName);
    if (updates.initialYear !== undefined) setInitialYear(updates.initialYear);
    if (updates.pais !== undefined) {
      setPais(updates.pais);
      // Load geo data when country changes
      loadGeoDataForCountry(updates.pais);
    }
    if (updates.provincia !== undefined) setProvincia(updates.provincia);
    if (updates.departamento !== undefined) setDepartamento(updates.departamento);
    if (updates.municipio !== undefined) setMunicipio(updates.municipio);
    if (updates.descripcion !== undefined) setDescripcion(updates.descripcion);
    if (updates.allowBenchmarking !== undefined) setAllowBenchmarking(updates.allowBenchmarking);
  };

  useEffect(() => {
    if (isTrialMode()) {
      const currentYear = new Date().getFullYear();
      const calculatedInitialYear = (currentYear - 10).toString();
      setInitialYear(calculatedInitialYear);
      // Set default location for subscribers
      setPais("Argentina");
      setProvincia("Buenos Aires");
      setDepartamento("");
      setMunicipio("");
    }
  }, []);

  // Load initial geo data if Argentina is selected
  useEffect(() => {
    if (pais === "Argentina") {
      loadGeoDataForCountry(pais);
    }
  }, []); // Only run once on mount

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1 && projectName && initialYear) {
      if (isTrialMode()) {
        setStep(3);
      } else {
        setStep(2);
      }
    } else if (step === 2 && pais && provincia && (pais !== "Argentina" || (departamento && municipio))) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleFinish = async () => {
    console.log('handleFinish called', { initialYear, pais, provincia, departamento, municipio, allowBenchmarking, isTrialMode: isTrialMode() });
    if (!initialYear || (isTrialMode() ? false : (!pais || !provincia || (pais === "Argentina" && (!departamento || !municipio)))) || !allowBenchmarking) {
      console.log('Validation failed');
      return;
    }
    console.log('Validation passed, proceeding to create project');

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

  const getStepTitle = () => {
    switch (step) {
      case 0: return "";
      case 1: return "Paso 1: Las Bases";
      case 2: return "Paso 2: Ubicación";
      case 3: return `Paso ${isTrialMode() ? 2 : 3}: Descripción`;
      case 4: return `Paso ${isTrialMode() ? 3 : 4}: Revisión`;
      default: return "";
    }
  };

  const renderStepContent = () => {
    if (step === 0) {
      return (
        <div className="text-center pb-8">
          <h2 className="text-4xl text-foreground mb-4">
            Configura tu Proyecto
          </h2>
          <p className="text-lg text-muted-foreground">
            Para que puedas empezar a registrar los datos de tus campañas primero define las bases de tu proyecto.
          </p>
        </div>
      );
    }

    if (step === 4) {
      // Review step
      return (
        <div className="space-y-6">
          <div className="bg-secondary/20 rounded-lg p-6 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Proyecto:</p>
              <p className="text-xl font-semibold text-foreground">{projectName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Año/Campaña inicial:</p>
              <p className="text-xl font-semibold text-foreground">{initialYear}</p>
            </div>
            {!isTrialMode() && (
              <>
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
        </div>
      );
    }

    return (
      <ProjectCreationForm
        step={step as 1 | 2 | 3}
        formData={formData}
        geoData={geoData}
        isTrialMode={isTrialMode()}
        onFormDataChange={handleFormDataChange}
        onGeoDataLoad={() => {}}
      />
    );
  };

  const renderNavigation = () => {
    if (step === 0) {
      return (
        <div className="flex justify-center pb-6">
          <Button
            onClick={handleNext}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-8 py-6 text-lg"
          >
            Comenzar
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="flex justify-between pt-4">
          <Button
            onClick={() => setStep(3)}
            variant="outline"
            className="gap-2"
          >
            <ChevronLeft className="h-5 w-5" />
            Volver
          </Button>
          <Button
            onClick={handleFinish}
            disabled={isCreating || !allowBenchmarking}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
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
      );
    }

    return (
      <div className="flex justify-between pt-4">
        <Button
          onClick={() => setStep(step - 1)}
          variant="outline"
          className="gap-2"
          disabled={step === 1}
        >
          <ChevronLeft className="h-5 w-5" />
          Volver
        </Button>
        <Button
          onClick={handleNext}
          disabled={
            (step === 1 && (!projectName || !initialYear)) ||
            (step === 2 && (!pais || !provincia ||
              (pais === "Argentina" && (!departamento || !municipio))))
          }
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          Siguiente
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {!modalOpen && (
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-2xl w-full border-border/50 ">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-4xl text-foreground mb-4">
                No tienes un proyecto
              </CardTitle>
              <p className="text-lg text-muted-foreground">
                Crea tu primer proyecto para comenzar a registrar tus campañas. Hacé clic en el botón para iniciar.
              </p>
            </CardHeader>
            <CardContent className="flex justify-center pb-8">
              <Button
                onClick={() => setModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-8 py-6 text-lg"
              >
                Crear Proyecto
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-foreground">
              Crear Nuevo Proyecto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {step !== 0 && step !== 4 && (
              <div className="text-center">
                <h3 className="text-xl text-foreground mb-2">
                  {getStepTitle()}
                </h3>
              </div>
            )}
            {renderStepContent()}
            {renderNavigation()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Onboarding;
