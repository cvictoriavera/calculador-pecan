export interface ProjectData {
  project_name: string;
  description?: string;
}

export interface UpdateProjectData {
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

declare module '@/services/projectService' {
  export function getProjects(): Promise<Project[]>;
  export function getProjectById(projectId: number): Promise<Project>;
  export function createProject(projectData: ProjectData): Promise<Project>;
  export function updateProject(projectId: number, projectData: UpdateProjectData): Promise<Project>;
  export function deleteProject(projectId: number): Promise<boolean>;
}