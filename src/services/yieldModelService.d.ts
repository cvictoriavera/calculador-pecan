interface YieldModel {
  id: number;
  project_id: number;
  variety: string;
  model_name: string;
  yield_data: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface YieldModelData {
  project_id: number;
  variety?: string;
  model_name: string;
  yield_data: string;
  is_active?: number;
}

interface YieldModelUpdateData {
  model_name?: string;
  yield_data?: string;
  is_active?: number;
}

declare module '@/services/yieldModelService' {
  export function getYieldModelsByProject(projectId: number): Promise<YieldModel[]>;
  export function createYieldModel(yieldModelData: YieldModelData): Promise<YieldModel>;
  export function updateYieldModel(modelId: number, yieldModelData: YieldModelUpdateData): Promise<YieldModel>;
  export function deleteYieldModel(modelId: number): Promise<void>;
}