import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { createProject } from "@/services/projectService";
import { ProjectCreationForm } from "./ProjectCreationForm";
import { useProjectForm } from "@/hooks/useProjectForm";
import type { ProjectFormData } from "@/types/project";
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateProjectModal = ({ open, onOpenChange }: CreateProjectModalProps) => {
  const navigate = useNavigate();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ProjectFormData>({
    projectName: "",
    initialYear: "",
    pais: "Argentina",
    provincia: "",
    departamento: "",
    municipio: "",
    descripcion: "",
    allowBenchmarking: false,
  });

  const { geoData, loadGeoDataForCountry } = useProjectForm();

  const isTrialMode = () => localStorage.getItem('isTrialMode') === 'true';

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      const initialYear = isTrialMode()
        ? (new Date().getFullYear() - 10).toString()
        : "";
      setFormData({
        projectName: "",
        initialYear,
        pais: "Argentina",
        provincia: "",
        departamento: "",
        municipio: "",
        descripcion: "",
        allowBenchmarking: false,
      });
      // Load initial geo data
      loadGeoDataForCountry("Argentina");
    }
  }, [open]);

  const handleFormDataChange = (updates: Partial<ProjectFormData>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      // Load geo data when country changes
      if (updates.pais && updates.pais !== prev.pais) {
        loadGeoDataForCountry(updates.pais);
      }
      return newData;
    });
  };

  const handleNext = () => {
    if (step === 1 && formData.projectName && formData.initialYear) {
      if (isTrialMode()) {
        setStep(3);
      } else {
        setStep(2);
      }
    } else if (step === 2 && formData.pais && formData.provincia &&
               (formData.pais !== "Argentina" || (formData.departamento && formData.municipio))) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handlePrev = () => {
    if (step === 3) {
      setStep(isTrialMode() ? 1 : 2);
    } else if (step === 2) {
      setStep(1);
    } else if (step === 4) {
      setStep(3);
    }
  };

  const handleCreate = async () => {
    if (!formData.initialYear ||
        (isTrialMode() ? false : (!formData.pais || !formData.provincia ||
         (formData.pais === "Argentina" && (!formData.departamento || !formData.municipio)))) ||
        !formData.allowBenchmarking) {
      toast.error("Por favor complete todos los campos requeridos");
      return;
    }

    setIsCreating(true);
    try {
      const projectData = {
        project_name: formData.projectName || "Proyecto 1",
        description: formData.descripcion,
        pais: formData.pais,
        provincia: formData.provincia,
        departamento: formData.departamento,
        municipio: formData.municipio,
        allow_benchmarking: formData.allowBenchmarking ? 1 : 0,
      };

      const createdProject = await createProject(projectData);
      const projectId = createdProject.id;

      // Complete onboarding with project ID to create campaigns
      await completeOnboarding(formData.projectName, parseInt(formData.initialYear), projectId);

      toast.success("Proyecto creado exitosamente");
      onOpenChange(false);
      navigate("/montes");
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Error al crear el proyecto. Por favor, inténtalo de nuevo.');
    } finally {
      setIsCreating(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Paso 1: Las Bases";
      case 2: return "Paso 2: Ubicación";
      case 3: return `Paso ${isTrialMode() ? 2 : 3}: Descripción`;
      case 4: return `Paso ${isTrialMode() ? 3 : 4}: Revisión`;
      default: return "";
    }
  };

  const renderStepContent = () => {
    if (step === 4) {
      // Review step
      return (
        <div className="space-y-6">
          <div className="bg-secondary/20 rounded-lg p-6 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Proyecto:</p>
              <p className="text-xl font-semibold text-foreground">{formData.projectName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Año/Campaña inicial:</p>
              <p className="text-xl font-semibold text-foreground">{formData.initialYear}</p>
            </div>
            {!isTrialMode() && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">País:</p>
                  <p className="text-xl font-semibold text-foreground">{formData.pais}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Provincia:</p>
                  <p className="text-xl font-semibold text-foreground">{formData.provincia}</p>
                </div>
                {formData.pais === "Argentina" && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Departamento:</p>
                      <p className="text-xl font-semibold text-foreground">{formData.departamento}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Municipio:</p>
                      <p className="text-xl font-semibold text-foreground">{formData.municipio}</p>
                    </div>
                  </>
                )}
              </>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Descripción:</p>
              <p className="text-lg text-foreground">{formData.descripcion}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowBenchmarking"
                checked={formData.allowBenchmarking}
                onChange={(e) => handleFormDataChange({ allowBenchmarking: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="allowBenchmarking" className="text-sm font-medium">
                He leído y acepto las políticas de privacidad
              </label>
            </div>
          </div>
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
    if (step === 4) {
      return (
        <div className="flex justify-between pt-4">
          <Button
            onClick={handlePrev}
            variant="outline"
            className="gap-2"
          >
            <ChevronLeft className="h-5 w-5" />
            Volver
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !formData.allowBenchmarking}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creando proyecto...
              </>
            ) : (
              <>
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
          onClick={handlePrev}
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
            (step === 1 && (!formData.projectName || !formData.initialYear)) ||
            (step === 2 && (!formData.pais || !formData.provincia ||
              (formData.pais === "Argentina" && (!formData.departamento || !formData.municipio))))
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Crear Nuevo Proyecto
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {step !== 4 && (
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {getStepTitle()}
              </h3>
            </div>
          )}
          {renderStepContent()}
          {renderNavigation()}
        </div>
      </DialogContent>
    </Dialog>
  );
};