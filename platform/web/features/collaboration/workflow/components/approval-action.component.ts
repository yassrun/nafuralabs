/**
 * Approve/Reject buttons – for current user to act on pending approval.
 * Inputs: entityType, entityId. Reject requires a comment when rejectCommentRequired is true.
 * Emits actionDone when approve or reject completes so parent can refresh banner and show toast.
 */

import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowApiService, ApprovalRequestDto } from '../services/workflow-api.service';

@Component({
  selector: 'nf-approval-action',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (pendingRequest()) {
      <div class="nf-approval-action">
        <span class="nf-approval-action__title">{{ approvalTitle() }}</span>
        <div class="nf-approval-action__row">
          <textarea
            class="nf-approval-action__comment"
            [value]="comment()"
            (input)="onCommentInput($event)"
            [placeholder]="commentPlaceholder()"
            [attr.aria-invalid]="showRejectCommentError()"
            rows="2"
          ></textarea>
          @if (showRejectCommentError()) {
            <p class="nf-approval-action__error">{{ rejectCommentRequiredMessage() }}</p>
          }
          <div class="nf-approval-action__btns">
            <button
              type="button"
              class="nf-approval-action__btn nf-approval-action__btn--approve"
              [disabled]="busy()"
              (click)="approve()"
            >
              {{ approveLabel() }}
            </button>
            <button
              type="button"
              class="nf-approval-action__btn nf-approval-action__btn--reject"
              [disabled]="busy()"
              (click)="reject()"
            >
              {{ rejectLabel() }}
            </button>
          </div>
        </div>
        @if (error()) {
          <p class="nf-approval-action__error">{{ error() }}</p>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .nf-approval-action {
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: 8px;
      padding: 12px;
      background: var(--nf-surface-card, #fff);
    }
    .nf-approval-action__title { font-weight: 500; display: block; margin-bottom: 8px; }
    .nf-approval-action__row { display: flex; flex-direction: column; gap: 8px; }
    .nf-approval-action__comment {
      width: 100%;
      border: 1px solid var(--nf-border-default);
      border-radius: 6px;
      padding: 6px 8px;
      font: inherit;
      resize: vertical;
    }
    .nf-approval-action__btns { display: flex; gap: 8px; }
    .nf-approval-action__btn {
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid transparent;
      cursor: pointer;
      font: inherit;
    }
    .nf-approval-action__btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .nf-approval-action__btn--approve { background: #059669; color: #fff; }
    .nf-approval-action__btn--reject { background: #dc2626; color: #fff; }
    .nf-approval-action__error { margin: 8px 0 0; color: #b91c1c; font-size: 0.875rem; }
  `],
})
export class ApprovalActionComponent {
  private readonly api = inject(WorkflowApiService);

  entityType = input.required<string>();
  entityId = input.required<string>();
  approvalTitle = input<string>('Approval required');
  approveLabel = input<string>('Approve');
  rejectLabel = input<string>('Reject');
  commentPlaceholder = input<string>('Comment (optional for Approve, required for Reject)');
  /** When true, reject() will not call API until user enters a comment. @default true */
  rejectCommentRequired = input<boolean>(true);
  rejectCommentRequiredMessage = input<string>('Comment is required when rejecting.');

  /** Emitted when approve or reject completes successfully (so parent can refresh banner and show toast). */
  actionDone = output<{ action: 'approve' | 'reject' }>();

  readonly pendingRequest = signal<ApprovalRequestDto | null>(null);
  readonly comment = signal('');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly showRejectCommentError = signal(false);

  constructor() {
    effect(() => {
      const et = this.entityType();
      const eid = this.entityId();
      if (et && eid) {
        this.loadPending(et, eid);
      }
    });
  }

  private loadPending(entityType: string, entityId: string): void {
    this.api.getPendingApprovals(entityType, entityId).subscribe({
      next: (list) => {
        this.pendingRequest.set(list.length > 0 ? list[0] : null);
        this.error.set(null);
      },
      error: () => {},
    });
  }

  onCommentInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    this.comment.set(target?.value ?? '');
  }

  approve(): void {
    const req = this.pendingRequest();
    if (!req || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.showRejectCommentError.set(false);
    this.api.approve(req.id, this.comment() || undefined).subscribe({
      next: () => {
        this.pendingRequest.set(null);
        this.comment.set('');
        this.busy.set(false);
        this.actionDone.emit({ action: 'approve' });
        const et = this.entityType();
        const eid = this.entityId();
        if (et && eid) this.loadPending(et, eid);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Action failed');
        this.busy.set(false);
      },
    });
  }

  reject(): void {
    const req = this.pendingRequest();
    if (!req || this.busy()) return;
    if (this.rejectCommentRequired() && !this.comment().trim()) {
      this.showRejectCommentError.set(true);
      return;
    }
    this.showRejectCommentError.set(false);
    this.busy.set(true);
    this.error.set(null);
    this.api.reject(req.id, this.comment() || undefined).subscribe({
      next: () => {
        this.pendingRequest.set(null);
        this.comment.set('');
        this.busy.set(false);
        this.actionDone.emit({ action: 'reject' });
        const et = this.entityType();
        const eid = this.entityId();
        if (et && eid) this.loadPending(et, eid);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Action failed');
        this.busy.set(false);
      },
    });
  }
}
