import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { FeatureApiService } from '@lib/anatomy';

import type {
  ApprovalDecision,
  ApprovalEntityType,
  ApprovalJournalAction,
  ApprovalRequest,
} from '../models';
import type { ApprovalSubmitInput } from '../models';
import {
  type ApiApprovalRequest,
  approvalActionToApi,
  approvalRequestToUi,
  approvalSubmitToApi,
} from './approbations.mapper';

@Injectable({ providedIn: 'root' })
export class ApprobationsApiService extends FeatureApiService<ApprovalRequest, ApprovalSubmitInput, never> {
  protected override basePath = '/api/v1/approbations/requests';

  private readonly translate = inject(TranslateService);
  private readonly _requests = signal<ApprovalRequest[]>([]);
  private readonly _loaded = signal(false);

  readonly requests = this._requests.asReadonly();
  readonly enAttente = computed(() => this._requests().filter((r) => r.status === 'EN_ATTENTE'));
  readonly countEnAttente = computed(() => this.enAttente().length);

  async refresh(): Promise<void> {
    try {
      const rows = await this.get<ApiApprovalRequest[]>(this.basePath);
      this._requests.set((rows ?? []).map(approvalRequestToUi));
    } catch {
      this._requests.set([]);
    }
    this._loaded.set(true);
  }

  async ensureLoaded(): Promise<void> {
    if (!this._loaded()) {
      await this.refresh();
    }
  }

  findById(id: string): ApprovalRequest | undefined {
    return this._requests().find((r) => r.id === id);
  }

  findByEntity(entityType: ApprovalEntityType, entityId: string): ApprovalRequest | undefined {
    return this._requests().find(
      (r) => r.entityType === entityType && r.entityId === entityId && r.status === 'EN_ATTENTE',
    );
  }

  async submit(input: ApprovalSubmitInput): Promise<ApprovalRequest> {
    const existing = this.findByEntity(input.entityType, input.entityId);
    if (existing) {
      return existing;
    }

    const initiatorName = input.initiateurNom ?? this.translate.instant('dashboard.approbations.audit.initiator');
    const initiatorId = input.initiateurId ?? 'me';

    const row = await this.post<ApiApprovalRequest>(
      this.basePath,
      approvalSubmitToApi({ ...input, initiateurId: initiatorId, initiateurNom: initiatorName }),
    );
    const created = approvalRequestToUi(row);
    this._requests.update((list) => [created, ...list]);
    return created;
  }

  async decide(id: string, decision: ApprovalDecision, commentaire?: string, par?: string): Promise<void> {
    const approver = par ?? this.translate.instant('dashboard.approbations.audit.selfApprover');
    const path =
      decision === 'APPROUVE'
        ? `${this.basePath}/${id}/approve`
        : decision === 'REJETE'
          ? `${this.basePath}/${id}/reject`
          : null;

    if (!path) {
      throw new Error(`Unsupported approval decision: ${decision}`);
    }

    const row = await this.post<ApiApprovalRequest>(
      path,
      approvalActionToApi(commentaire, approver, approver),
    );
    const updated = approvalRequestToUi(row);
    this._requests.update((list) => list.map((r) => (r.id === id ? updated : r)));
  }

  async appendJournalAction(
    id: string,
    action: ApprovalJournalAction,
    commentaire: string | undefined,
    par: string,
  ): Promise<void> {
    const pathMap: Partial<Record<ApprovalJournalAction, string>> = {
      DEMANDE_COMPLEMENT: 'demande-complement',
      COMMENTE: 'commenter',
      DELEGUE: 'deleguer',
    };
    const suffix = pathMap[action];

    if (!suffix) {
      throw new Error(`Unsupported journal action: ${action}`);
    }

    const row = await this.post<ApiApprovalRequest>(
      `${this.basePath}/${id}/${suffix}`,
      approvalActionToApi(commentaire, par, par),
    );
    const updated = approvalRequestToUi(row);
    this._requests.update((list) => list.map((r) => (r.id === id ? updated : r)));
  }

  async verifyJournalChain(req: ApprovalRequest): Promise<boolean> {
    try {
      const result = await this.get<{ valid: boolean }>(`${this.basePath}/${req.id}/verify-integrity`);
      return result?.valid ?? false;
    } catch {
      return false;
    }
  }
}
