import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { createProject } from "@/services/projectService";
import { ChevronRight, Check, Loader2 } from "lucide-react";

const Onboarding = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [initialYear, setInitialYear] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = () => {
    setStep(1);
  };

  const handleNext = () => {
    if (projectName && initialYear) {
      setStep(2);
    }
  };

  const handleFinish = async () => {
    if (!projectName || !initialYear) return;

    setIsCreating(true);
    setError(null);

    try {
      // Create the project
      const projectData = {
        project_name: projectName,
        description: `Proyecto creado en ${new Date().getFullYear()}`,
      };

      const createdProject = await createProject(projectData);
      const projectId = createdProject.id;

      // Complete onboarding with project ID to create campaigns
      await completeOnboarding(projectName, parseInt(initialYear), projectId);

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
              Vamos a configurar tu Proyecto
            </CardTitle>
            <p className="text-lg text-muted-foreground">
              Para que el sistema pueda registrar tus datos correctamente, necesitamos registrar cómo está compuesto tu campo hoy.
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
              Paso 1: Los Cimientos
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
              <Input
                id="initialYear"
                type="number"
                placeholder="ej: 2010"
                value={initialYear}
                onChange={(e) => setInitialYear(e.target.value)}
                className="text-lg py-6"
              />
            </div>
            <div className="flex justify-end pt-4">
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full border-border/50 shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-foreground">
            Paso 2: Revisión
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
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleFinish}
              disabled={isCreating}
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
                  Finalizar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
