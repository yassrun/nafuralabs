/**
 * Platform Workflow/Approval API – approvals and workflow trigger.
 * Base path: /api/v1/platform/collaboration/approvals and /workflows
 */

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from '../../../../core/config/api-config.service';

const APPROVALS_BASE = '/api/v1/platform/collaboration/approvals';
const WORKFLOWS_BASE = '/api/v1/platform/collaboration/workflows';

export interface ApprovalRequestDto {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  status: string;
  currentStep?: string;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  decisionComment?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  size: number;
  number: number;
}

/** Workflow template (for entity type, used in Submit for Approval). */
export interface WorkflowTemplateDto {
  id: string;
  code: string;
  name: string;
  entityType: string;
  description?: string;
  isActive?: boolean;
  stepCount?: number;
}

/** Workflow instance returned by trigger. */
export interface WorkflowInstanceDto {
  id: string;
  instanceNumber?: string;
  templateId: string;
  entityType: string;
  entityId: string;
  currentStepId?: string;
  status: string;
  initiatedBy?: string;
  startedAt?: string;
  completedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class WorkflowApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private url(path: string): string {
    const base = this.apiConfig.apiBaseUrl();
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  listApprovals(entityType: string, entityId: string, page = 0, size = 20): Observable<PageResponse<ApprovalRequestDto>> {
    const params = new HttpParams()
      .set('entityType', entityType)
      .set('entityId', entityId)
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<PageResponse<ApprovalRequestDto>>(this.url(APPROVALS_BASE), { params });
  }

  getPendingApprovals(entityType: string, entityId: string): Observable<ApprovalRequestDto[]> {
    const params = new HttpParams().set('entityType', entityType).set('entityId', entityId);
    return this.http.get<ApprovalRequestDto[]>(this.url(`${APPROVALS_BASE}/pending`), { params });
  }

  /** Pending approvals for the current user (dashboard). No params. */
  getMyPendingApprovals(): Observable<ApprovalRequestDto[]> {
    return this.http.get<ApprovalRequestDto[]>(this.url(`${APPROVALS_BASE}/pending`));
  }

  /** Pending count for sidebar badge. */
  getMyPendingCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(this.url(`${APPROVALS_BASE}/pending/count`));
  }

  /** History of requests the current user approved/rejected. */
  getMyApprovalHistory(): Observable<ApprovalRequestDto[]> {
    return this.http.get<ApprovalRequestDto[]>(this.url(`${APPROVALS_BASE}/history`));
  }

  requestApproval(
    entityType: string,
    entityId: string,
    title: string,
    workflow: { stepNumber: number; approverRole: string; approverId?: string }[]
  ): Observable<ApprovalRequestDto> {
    return this.http.post<ApprovalRequestDto>(this.url(`${APPROVALS_BASE}/request`), {
      entityType,
      entityId,
      title,
      workflow,
    });
  }

  approve(approvalRequestId: string, comment?: string): Observable<void> {
    return this.http.post<void>(this.url(`${APPROVALS_BASE}/${approvalRequestId}/approve`), { comment });
  }

  reject(approvalRequestId: string, comment?: string): Observable<void> {
    return this.http.post<void>(this.url(`${APPROVALS_BASE}/${approvalRequestId}/reject`), { comment });
  }

  // ─── Workflow (template-based trigger) ───────────────────────────────────

  /** List active workflow templates for an entity type. */
  listTemplatesByEntityType(entityType: string): Observable<WorkflowTemplateDto[]> {
    const params = new HttpParams().set('entityType', entityType);
    return this.http.get<WorkflowTemplateDto[]>(this.url(`${WORKFLOWS_BASE}/templates`), { params });
  }

  /** Trigger a workflow for an entity. Event is typically template code. */
  trigger(templateCode: string, entityType: string, entityId: string): Observable<WorkflowInstanceDto | null> {
    return this.http.post<WorkflowInstanceDto | null>(
      this.url(`${WORKFLOWS_BASE}/trigger`),
      { entityType, entityId, templateCode },
      { params: { event: templateCode } }
    );
  }
}
