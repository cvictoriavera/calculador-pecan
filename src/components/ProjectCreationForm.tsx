import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectCreationFormProps } from "@/types/project";

export const ProjectCreationForm = ({
  step,
  formData,
  geoData,
  isTrialMode,
  onFormDataChange,
}: Omit<ProjectCreationFormProps, 'isCreating'>) => {
  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    onFormDataChange({ [field]: value });
  };

  const handleProvinciaChange = (value: string) => {
    onFormDataChange({
      provincia: value,
      departamento: "", // Clear dependent fields
      municipio: "",
    });
  };

  const handleDepartamentoChange = (value: string) => {
    onFormDataChange({
      departamento: value,
      municipio: "", // Clear dependent field
    });
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

  // Step 2: Location
  if (step === 2) {
    return (
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="pais" className="text-base font-medium">
            País
          </Label>
          <Select value={formData.pais} onValueChange={(value) => handleInputChange('pais', value)}>
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
        {formData.pais === "Argentina" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="provincia" className="text-base font-medium">
                Provincia
              </Label>
              <Select
                value={formData.provincia}
                onValueChange={handleProvinciaChange}
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
                value={formData.departamento}
                onValueChange={handleDepartamentoChange}
                disabled={!formData.provincia}
              >
                <SelectTrigger className="text-lg py-6">
                  <SelectValue placeholder="Selecciona un departamento" />
                </SelectTrigger>
                <SelectContent>
                  {formData.provincia && geoData.departments[formData.provincia]?.map((dept) => (
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
                value={formData.municipio}
                onValueChange={(value) => handleInputChange('municipio', value)}
                disabled={!formData.departamento}
              >
                <SelectTrigger className="text-lg py-6">
                  <SelectValue placeholder="Selecciona un municipio" />
                </SelectTrigger>
                <SelectContent>
                  {formData.departamento && formData.provincia && geoData.municipalities[`${formData.provincia}-${formData.departamento}`]?.map((mun) => (
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
              value={formData.provincia}
              onChange={(e) => handleInputChange('provincia', e.target.value)}
              className="text-lg py-6"
            />
          </div>
        )}
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