import { inject, Injectable } from '@angular/core';
import { signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { ApprovalRequestDto } from '@platform/features/collaboration/workflow/services/workflow-api.service';
import { WorkflowApiService } from '@platform/features/collaboration/workflow/services/workflow-api.service';

@Injectable({ providedIn: 'root' })
export class ApprovalsFacade {
  private readonly api = inject(WorkflowApiService);

  private readonly _pending = signal<ApprovalRequestDto[]>([]);
  private readonly _history = signal<ApprovalRequestDto[]>([]);
  private readonly _pendingCount = signal<number>(0);
  private readonly _loadingPending = signal(false);
  private readonly _loadingHistory = signal(false);
  private readonly _actionBusyId = signal<string | null>(null);

  readonly pending = this._pending.asReadonly();
  readonly history = this._history.asReadonly();
  readonly pendingCount = this._pendingCount.asReadonly();
  readonly loadingPending = this._loadingPending.asReadonly();
  readonly loadingHistory = this._loadingHistory.asReadonly();
  readonly actionBusyId = this._actionBusyId.asReadonly();
  readonly hasPending = computed(() => this._pending().length > 0);

  /** Load pending list and update count. */
  async loadPending(): Promise<void> {
    this._loadingPending.set(true);
    try {
      const [list, countRes] = await Promise.all([
        firstValueFrom(this.api.getMyPendingApprovals()),
        firstValueFrom(this.api.getMyPendingCount()),
      ]);
      this._pending.set(list);
      this._pendingCount.set(countRes.count);
    } finally {
      this._loadingPending.set(false);
    }
  }

  /** Load history list. */
  async loadHistory(): Promise<void> {
    this._loadingHistory.set(true);
    try {
      const list = await firstValueFrom(this.api.getMyApprovalHistory());
      this._history.set(list);
    } finally {
      this._loadingHistory.set(false);
    }
  }

  /** Refresh only the pending count (e.g. after approve/reject). */
  async refreshPendingCount(): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.getMyPendingCount());
      this._pendingCount.set(res.count);
    } catch {
      // ignore
    }
  }

  /** Approve with optional comment. Removes item from pending and refreshes count. */
  async approve(id: string, comment?: string): Promise<void> {
    this._actionBusyId.set(id);
    try {
      await firstValueFrom(this.api.approve(id, comment));
      this._pending.update((list) => list.filter((r) => r.id !== id));
      await this.refreshPendingCount();
    } finally {
      this._actionBusyId.set(null);
    }
  }

  /** Reject with comment (required). Removes item from pending and refreshes count. */
  async reject(id: string, comment: string): Promise<void> {
    this._actionBusyId.set(id);
    try {
      await firstValueFrom(this.api.reject(id, comment));
      this._pending.update((list) => list.filter((r) => r.id !== id));
      await this.refreshPendingCount();
    } finally {
      this._actionBusyId.set(null);
    }
  }

  /** Badge for sidebar: { value, variant, hideWhenZero }. */
  pendingCountBadge(): { value: number; variant: 'info'; hideWhenZero: boolean } | null {
    const count = this._pendingCount();
    return { value: count, variant: 'info', hideWhenZero: true };
  }
}
