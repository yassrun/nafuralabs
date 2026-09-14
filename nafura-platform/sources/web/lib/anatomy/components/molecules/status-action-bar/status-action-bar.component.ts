import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { BadgeComponent } from '../../atoms/badge';
import { ButtonComponent } from '../../atoms/button';
import type {
  StatusActionBarConfig,
  StatusActionContext,
  StatusChangeRecord,
} from '../../../types';
import { resolveStatusActions, resolveStatusDef } from '../../../utils/resolve-status-actions';
import {
  StatusHistoryDialogComponent,
  type StatusHistoryEntryView,
} from './status-history-dialog.component';

/**
 * Reusable status + actions strip.
 * Status on the left, transition / command buttons on the right.
 * Historique opens a dialog: who did what, and when.
 */
@Component({
  selector: 'nf-status-action-bar',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    BadgeComponent,
    ButtonComponent,
    StatusHistoryDialogComponent,
  ],
  template: `
    <div class="nf-sab">
      <div class="nf-sab__status">
        @if (statusDef(); as def) {
          <button
            type="button"
            class="nf-sab__badge-btn"
            aria-haspopup="dialog"
            [attr.aria-expanded]="historyOpen()"
            (click)="openHistory()"
          >
            <nf-badge [variant]="def.variant" size="md" rounded>{{ def.label }}</nf-badge>
            <mat-icon class="nf-sab__history-icon" aria-hidden="true">history</mat-icon>
            <span class="nf-sab__history-label">Historique</span>
          </button>
        }
      </div>

      <div class="nf-sab__actions">
        <ng-content />
        @for (action of visibleActions(); track action.action) {
          <nf-button
            [variant]="action.variant"
            size="sm"
            [disabled]="disabled() || action.disabled"
            [attr.data-testid]="action.testId || null"
            (clicked)="onAction(action.action)"
          >
            {{ action.actionLabel }}
          </nf-button>
        }
      </div>
    </div>

    <nf-status-history-dialog
      [open]="historyOpen()"
      [subtitle]="historyTitle()"
      [loading]="historyLoading()"
      [entries]="historyViews()"
      (closed)="historyOpen.set(false)"
    />
  `,
  styles: [`
    :host { display: block; }

    .nf-sab {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
      width: 100%;
      padding: 0.4rem 0;
    }

    .nf-sab__status { min-width: 0; }

    .nf-sab__badge-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      cursor: pointer;
      color: inherit;
    }

    .nf-sab__history-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      opacity: 0.65;
    }

    .nf-sab__history-label {
      font-size: 0.75rem;
      color: var(--nf-color-text-tertiary, #64748b);
    }

    .nf-sab__badge-btn:hover .nf-sab__history-label,
    .nf-sab__badge-btn:hover .nf-sab__history-icon,
    .nf-sab__badge-btn[aria-expanded='true'] .nf-sab__history-label {
      color: var(--nf-color-text-primary);
      opacity: 1;
    }

    .nf-sab__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      align-items: center;
      justify-content: flex-end;
      margin-left: auto;
    }
  `],
})
export class StatusActionBarComponent<
  TStatus extends string = string,
  TCtx extends StatusActionContext = StatusActionContext,
> {
  readonly status = input.required<string>();
  readonly config = input.required<StatusActionBarConfig<TStatus, TCtx>>();
  readonly context = input<TCtx | undefined>(undefined);
  readonly history = input<StatusChangeRecord[]>([]);
  readonly historyLoading = input(false);
  readonly historyTitle = input('');
  readonly disabled = input(false);

  readonly action = output<string>();
  readonly historyRequested = output<void>();

  readonly historyOpen = signal(false);

  readonly statusDef = computed(() => resolveStatusDef(this.config(), this.status()));

  readonly visibleActions = computed(() => {
    const ctx = this.context() ?? ({ status: this.status() } as TCtx);
    return resolveStatusActions(this.config(), { ...ctx, status: this.status() });
  });

  readonly historyViews = computed((): StatusHistoryEntryView[] =>
    this.history().map((entry) => ({
      id: entry.id,
      who: this.displayActor(entry.actor),
      what: this.actionLabel(entry),
      fromLabel: entry.fromStatus ? this.statusLabel(entry.fromStatus) : '',
      toLabel: this.statusLabel(entry.toStatus),
      when: this.formatWhen(entry.at),
      whenIso: entry.at,
      motif: entry.motif,
    })),
  );

  onAction(code: string): void {
    this.action.emit(code);
  }

  openHistory(): void {
    this.historyOpen.set(true);
    this.historyRequested.emit();
  }

  statusLabel(code: string): string {
    return resolveStatusDef(this.config(), code)?.label ?? code;
  }

  actionLabel(entry: StatusChangeRecord): string {
    if (entry.action) {
      const hit = this.config().transitions.find(
        (t) => t.action === entry.action || t.backendAction === entry.action,
      );
      if (hit?.actionLabel) return hit.actionLabel;
    }
    return entry.toStatus
      ? `Passage à ${this.statusLabel(entry.toStatus)}`
      : 'Changement de statut';
  }

  displayActor(actor: string): string {
    const value = (actor ?? '').trim();
    if (!value || value.toLowerCase() === 'system') return 'Système';
    return value;
  }

  formatWhen(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    const formatted = date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return formatted.replace(',', ' à');
  }
}
