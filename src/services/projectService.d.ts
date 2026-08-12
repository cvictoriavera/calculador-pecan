export interface ProjectData {
  project_name: string;
  description?: string;
  campaigns?: ProjectCampaignData[];
}

export interface ProjectCampaignData {
  campaign_name: string;
  year: number;
  start_date: string;
  end_date: string;
  status?: string;
  is_current?: number;
  notes?: string;
  average_price?: number;
  total_production?: number;
}

export interface UpdateProjectData {
  project_name?: string;
  pais?: string;
  provincia?: string;
  departamento?: string;
  municipio?: string;
  description?: string;
  allow_benchmarking?: number;
}

export interface Project {
  id: number;
  user_id: number;
  project_name: string;
  description: string;
  pais?: string;
  provincia?: string;
  departamento?: string;
  municipio?: string;
  allow_benchmarking?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ExportData {
  version: string;
  exported_at: string;
  project: {
    project_name: string;
    description: string;
    pais: string;
    provincia: string;
    departamento: string;
    municipio: string;
    initial_year: number;
    allow_benchmarking: boolean;
  };
  montes: any[];
  campaigns: any[];
  costs: any[];
  investments: any[];
  productions: any[];
  yield_models: any[];
  annual_records: any[];
}

export interface ImportResult {
  success: boolean;
  message: string;
}

export interface BenchmarkingProject {
  id: number;
  user_id: number;
  user_name: string;
  project_name: string;
  pais?: string;
  provincia?: string;
  departamento?: string;
  municipio?: string;
  localidad?: string;
  allow_benchmarking: number;
  total_ha: number;
  campaign_year: number;
  total_costos_op: number;
  costo_por_ha: number;
  costo_por_kg: number;
  total_production_kg: number;
}

declare module '@/services/projectService' {
  export function getProjects(): Promise<Project[]>;
  export function getBenchmarkingProjects(): Promise<BenchmarkingProject[]>;
  export function exportBenchmarkingData(): Promise<{
    projects: any[];
    campaigns: any[];
    montes: any[];
    costs: any[];
    productions: any[];
    investments: any[];
    yield_models: any[];
  }>;
  export function getProjectById(projectId: number): Promise<Project>;
  export function createProject(projectData: ProjectData): Promise<Project>;
  export function updateProject(projectId: number, projectData: UpdateProjectData): Promise<Project>;
  export function deleteProject(projectId: number): Promise<boolean>;
  export function exportProject(projectId: number): Promise<ExportData>;
  export function importProject(projectId: number, jsonData: ExportData | string): Promise<ImportResult>;
}
