/**
 * Workflow template and step models for admin template management.
 * Aligns with backend WorkflowTemplateDto.
 */

export interface WorkflowStepDto {
  id?: string;
  stepNumber: number;
  name: string;
  approverPermission: string;
  timeoutHours?: number | null;
  escalationPermission?: string | null;
  condition?: string | null;
}

export interface WorkflowTemplate {
  id: string;
  code: string;
  name: string;
  entityType: string;
  description?: string | null;
  isActive: boolean;
  stepCount?: number;
  steps?: WorkflowStepDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowTemplateCreate {
  code: string;
  name: string;
  entityType: string;
  description?: string | null;
  isActive?: boolean;
  steps: WorkflowStepDto[];
}

export interface WorkflowTemplateUpdate {
  code: string;
  name: string;
  entityType: string;
  description?: string | null;
  isActive: boolean;
  steps: WorkflowStepDto[];
}
