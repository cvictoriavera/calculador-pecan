export interface ProjectData {
  project_name: string;
  description?: string;
}

export interface UpdateProjectData {
  project_name?: string;
  pais?: string;
  provincia?: string;
  departamento?: string;
  municipio?: string;
  description?: string;
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

declare module '@/services/projectService' {
  export function getProjects(): Promise<Project[]>;
  export function getProjectById(projectId: number): Promise<Project>;
  export function createProject(projectData: ProjectData): Promise<Project>;
  export function updateProject(projectId: number, projectData: UpdateProjectData): Promise<Project>;
  export function deleteProject(projectId: number): Promise<boolean>;
  export function exportProject(projectId: number): Promise<ExportData>;
  export function importProject(projectId: number, jsonData: ExportData | string): Promise<ImportResult>;
}