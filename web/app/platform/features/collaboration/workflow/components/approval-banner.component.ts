/**
 * Inline approval status banner – show pending/approved/rejected for an entity.
 * Inputs: entityType, entityId. Optional refreshTrigger to force reload. Emits resubmitRequested when Resubmit is clicked.
 */

import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { WorkflowApiService, ApprovalRequestDto } from '../services/workflow-api.service';

@Component({
  selector: 'nf-approval-banner',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    @if (loading()) {
      <div class="nf-approval-banner nf-approval-banner--loading">{{ loadingLabel() }}</div>
    } @else if (pending().length > 0) {
      <div class="nf-approval-banner nf-approval-banner--pending">
        <span class="nf-approval-banner__icon">&#x23F3;</span>
        <div class="nf-approval-banner__text">
          <span>{{ pendingLabel() }} — {{ pending()[0].title }}</span>
          <span class="nf-approval-banner__meta">Submitted by {{ pending()[0].requestedBy }} on {{ pending()[0].requestedAt | date:'short' }}</span>
          @if (pending()[0].currentStep) {
            <span class="nf-approval-banner__meta">Waiting for: {{ pending()[0].currentStep }}</span>
          }
        </div>
      </div>
    } @else if (lastApproved()) {
      <div class="nf-approval-banner nf-approval-banner--approved">
        <span class="nf-approval-banner__icon">&#x2713;</span>
        <span>{{ approvedLabel() }} by {{ lastApproved()!.approvedBy }} on {{ lastApproved()!.approvedAt | date:'short' }}</span>
      </div>
    } @else if (lastRejected()) {
      <div class="nf-approval-banner nf-approval-banner--rejected">
        <span class="nf-approval-banner__icon">&#x2717;</span>
        <div class="nf-approval-banner__text">
          <span>{{ rejectedLabel() }} by {{ lastRejected()!.approvedBy }}{{ lastRejected()!.approvedAt ? ' on ' + (lastRejected()!.approvedAt | date:'short') : '' }}</span>
          @if (lastRejected()!.decisionComment) {
            <span class="nf-approval-banner__comment">— {{ lastRejected()!.decisionComment }}</span>
          }
          @if (showResubmitButton()) {
            <button type="button" class="nf-approval-banner__resubmit" mat-stroked-button (click)="onResubmit()">
              {{ resubmitLabel() }}
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .nf-approval-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.875rem;
    }
    .nf-approval-banner--loading { color: var(--nf-text-muted); }
    .nf-approval-banner--pending { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
    .nf-approval-banner--approved { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
    .nf-approval-banner--rejected { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .nf-approval-banner__icon { font-weight: bold; }
    .nf-approval-banner__text { display: flex; flex-direction: column; gap: 2px; }
    .nf-approval-banner__meta { color: inherit; opacity: 0.9; font-size: 0.8rem; }
    .nf-approval-banner__comment { font-style: italic; opacity: 0.9; }
    .nf-approval-banner__resubmit { margin-top: 8px; }
  `],
})
export class ApprovalBannerComponent {
  private readonly api = inject(WorkflowApiService);

  entityType = input.required<string>();
  entityId = input.required<string>();
  /** Increment or change to force a reload (e.g. after trigger/approve/reject). */
  refreshTrigger = input<unknown>(undefined);
  loadingLabel = input<string>('Loading...');
  pendingLabel = input<string>('Pending Approval');
  approvedLabel = input<string>('Approved');
  rejectedLabel = input<string>('Rejected');
  resubmitLabel = input<string>('Resubmit');
  showResubmitButton = input<boolean>(true);

  resubmitRequested = output<void>();

  /** Emits when loading finishes so parent can know whether to show Submit for Approval. */
  approvalState = output<'loading' | 'none' | 'pending' | 'approved' | 'rejected'>();

  readonly loading = signal(false);
  readonly requests = signal<ApprovalRequestDto[]>([]);

  readonly pending = signal<ApprovalRequestDto[]>([]);
  readonly lastApproved = signal<ApprovalRequestDto | null>(null);
  readonly lastRejected = signal<ApprovalRequestDto | null>(null);

  constructor() {
    effect(() => {
      const et = this.entityType();
      const eid = this.entityId();
      this.refreshTrigger();
      if (et && eid) {
        this.load(et, eid);
      }
    });
  }

  /** Public method for parent to trigger reload. */
  refresh(): void {
    const et = this.entityType();
    const eid = this.entityId();
    if (et && eid) this.load(et, eid);
  }

  onResubmit(): void {
    this.resubmitRequested.emit();
  }

  private load(entityType: string, entityId: string): void {
    this.loading.set(true);
    this.api.listApprovals(entityType, entityId, 0, 20).subscribe({
      next: (page) => {
        const list = page.content ?? [];
        this.requests.set(list);
        const pendingList = list.filter((r) => r.status === 'PENDING');
        const approved = list.find((r) => r.status === 'APPROVED') ?? null;
        const rejected = list.find((r) => r.status === 'REJECTED') ?? null;
        this.pending.set(pendingList);
        this.lastApproved.set(approved);
        this.lastRejected.set(rejected);
        this.loading.set(false);
        const state: 'none' | 'pending' | 'approved' | 'rejected' =
          pendingList.length > 0 ? 'pending' : approved ? 'approved' : rejected ? 'rejected' : 'none';
        this.approvalState.emit(state);
      },
      error: () => {
        this.loading.set(false);
        this.approvalState.emit('none');
      },
    });
  }
}
