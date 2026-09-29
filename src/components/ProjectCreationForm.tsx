import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LocationSelector } from "@/components/projects/LocationSelector";
import type { ProjectCreationFormProps } from "@/types/project";

export const ProjectCreationForm = ({
  step,
  formData,
  isTrialMode,
  onFormDataChange,
}: Omit<ProjectCreationFormProps, 'isCreating'>) => {
  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    onFormDataChange({ [field]: value });
  };

  // Step 1: Basic Information
  if (step === 1) {
    return (
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="projectName" className="text-base font-medium">
            Nombre del proyecto
          </Label>
          <Input
            id="projectName"
            placeholder="Finca Los Arroyos"
            value={formData.projectName}
            onChange={(e) => handleInputChange('projectName', e.target.value)}
            className="text-lg py-6"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="initialYear" className="text-base font-medium">
            Año/Campaña inicial
          </Label>
          {isTrialMode ? (
            <div className="space-y-2">
              <Input
                id="initialYear"
                value={formData.initialYear}
                disabled
                className="text-lg py-6"
                placeholder="Año calculado automáticamente"
              />
              <p className="text-sm text-muted-foreground">
                En modo prueba no puedes cambiar el año de inicio.
              </p>
            </div>
          ) : (
            <Select value={formData.initialYear} onValueChange={(value) => handleInputChange('initialYear', value)}>
              <SelectTrigger className="text-lg py-6">
                <SelectValue placeholder="Selecciona un año" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: new Date().getFullYear() - 1990 + 1 }, (_, i) => 1990 + i).reverse().map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    );
  }

  // Step 2: Location (Fixed User Country + Cascade Territory Selection)
  if (step === 2) {
    return (
      <CardContent className="space-y-6">
        <LocationSelector
          selectedTerritoryId={formData.geographic_territory_id || null}
          onChange={(territoryId, localityName, departmentName, provinceName) => {
            onFormDataChange({
              geographic_territory_id: territoryId || undefined,
              provincia: provinceName || "",
              departamento: departmentName || "",
              municipio: localityName || "",
            });
          }}
        />
      </CardContent>
    );
  }

  // Step 3: Description
  if (step === 3) {
    return (
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="descripcion" className="text-base font-medium">
            Descripción del Proyecto
          </Label>
          <Textarea
            id="descripcion"
            placeholder="Breve descripción del proyecto"
            value={formData.descripcion}
            onChange={(e) => handleInputChange('descripcion', e.target.value)}
            className="text-lg min-h-[100px]"
          />
        </div>
      </CardContent>
    );
  }

  return null;
};