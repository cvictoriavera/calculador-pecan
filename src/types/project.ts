export interface ProjectFormData {
  projectName: string;
  initialYear: string;
  pais: string;
  provincia: string;
  departamento: string;
  municipio: string;
  descripcion: string;
  allowBenchmarking: boolean;
}

export interface GeoData {
  provinces: string[];
  departments: { [province: string]: string[] };
  municipalities: { [key: string]: string[] };
}

export interface ProjectCreationFormProps {
  step: 1 | 2 | 3; // Form steps only (1: basics, 2: location, 3: description)
  formData: ProjectFormData;
  geoData: GeoData;
  isTrialMode: boolean;
  isCreating: boolean;
  onFormDataChange: (updates: Partial<ProjectFormData>) => void;
  onGeoDataLoad: (pais: string) => void;
}