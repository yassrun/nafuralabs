/**
 * Audit trail organism – timeline list of audit entries with search and action filter.
 * Used by AuditTimelineComponent for entity-scoped activity.
 */

import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

export interface AuditTrailEntry {
  id: string;
  actor: string;
  action: string;
  at: string;
  target?: string;
  details?: string;
  /** Translated verb (e.g. "created", "updated"). */
  verb?: string;
  /** Material icon name for the action. */
  icon?: string;
  /** CSS class for icon color: nf-audit-trail__icon--green, --blue, --amber, --red, --gray */
  iconClass?: string;
}

/** Action filter value: '' = all, or specific action type */
export type AuditActionFilter = '' | 'create' | 'update' | 'status_change' | 'delete' | 'publish' | 'approve' | 'reject' | 'assign' | 'comment' | 'attach';

@Component({
  selector: 'nf-audit-trail',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatFormFieldModule, MatSelectModule, MatIconModule],
  template: `
    <section class="nf-audit-trail">
      <header class="nf-audit-trail__header">
        <h3 class="nf-audit-trail__title">{{ title() | translate }}</h3>
        @if (showSearchAndFilter()) {
          <div class="nf-audit-trail__controls">
            <input
              class="nf-audit-trail__search"
              type="search"
              [value]="query()"
              [placeholder]="searchPlaceholder() | translate"
              (input)="onQueryInput($event)">
            <mat-form-field appearance="outline" class="nf-audit-trail__filter" subscriptSizing="dynamic">
              <mat-select
                [value]="actionFilter()"
                (valueChange)="actionFilter.set($event)"
                [attr.aria-label]="filterLabel() | translate">
                <mat-option value="">{{ filterAllLabel() | translate }}</mat-option>
                <mat-option value="create">{{ filterCreatesLabel() | translate }}</mat-option>
                <mat-option value="update">{{ filterUpdatesLabel() | translate }}</mat-option>
                <mat-option value="status_change">{{ filterStatusChangesLabel() | translate }}</mat-option>
                <mat-option value="delete">{{ filterDeletesLabel() | translate }}</mat-option>
                <mat-option value="publish">{{ filterPublishLabel() | translate }}</mat-option>
                <mat-option value="approve">{{ filterApproveLabel() | translate }}</mat-option>
                <mat-option value="reject">{{ filterRejectLabel() | translate }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        }
      </header>

      @if (filteredEntries().length === 0) {
        <p class="nf-audit-trail__empty">{{ emptyLabel() | translate }}</p>
      } @else {
        <ol class="nf-audit-trail__list">
          @for (entry of filteredEntries(); track entry.id) {
            <li class="nf-audit-trail__row">
              <div class="nf-audit-trail__line"></div>
              <button type="button" class="nf-audit-trail__card" (click)="onEntryClick(entry)">
                <div class="nf-audit-trail__top">
                  <span class="nf-audit-trail__icon-wrap" [class]="entry.iconClass ?? ''">
                    @if (entry.icon) {
                      <mat-icon class="nf-audit-trail__icon">{{ entry.icon }}</mat-icon>
                    }
                  </span>
                  <span class="nf-audit-trail__summary">
                    <span class="nf-audit-trail__actor">{{ entry.actor }}</span>
                    <span class="nf-audit-trail__verb">{{ entry.verb ?? entry.action }}</span>
                  </span>
                  <time class="nf-audit-trail__time" [attr.datetime]="entry.at">{{ formatRelativeTime(entry.at) }}</time>
                </div>
                @if (entry.details) {
                  <p class="nf-audit-trail__details">{{ entry.details }}</p>
                }
              </button>
            </li>
          }
        </ol>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .nf-audit-trail { display: flex; flex-direction: column; gap: var(--nf-space-3, 12px); }
    .nf-audit-trail__header { display: flex; flex-wrap: wrap; gap: var(--nf-space-3, 12px); align-items: center; justify-content: space-between; }
    .nf-audit-trail__title { margin: 0; color: var(--nf-text-primary, #111827); font-size: var(--nf-font-size-md, 1rem); font-weight: 600; }
    .nf-audit-trail__controls { display: flex; gap: var(--nf-space-2, 8px); align-items: center; flex-wrap: wrap; }
    .nf-audit-trail__search {
      width: min(280px, 100%);
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: 8px;
      padding: 6px 10px;
      color: var(--nf-text-primary);
      background: var(--nf-surface-card, #fff);
      font-size: 0.875rem;
    }
    .nf-audit-trail__filter { width: min(180px, 100%); font-size: 0.875rem; }
    .nf-audit-trail__filter .mat-mdc-form-field-subscript-wrapper { display: none; }
    .nf-audit-trail__empty { margin: 0; color: var(--nf-text-muted, #6b7280); font-size: 0.875rem; }
    .nf-audit-trail__list { margin: 0; padding: 0; padding-left: 24px; list-style: none; display: flex; flex-direction: column; gap: 0; position: relative; border-left: 2px solid var(--nf-border-default, #e5e7eb); margin-left: 8px; }
    .nf-audit-trail__row { margin: 0; position: relative; padding-bottom: var(--nf-space-3, 12px); }
    .nf-audit-trail__row:last-child { padding-bottom: 0; }
    .nf-audit-trail__line { position: absolute; left: -24px; top: 14px; width: 10px; height: 2px; background: var(--nf-border-default, #e5e7eb); }
    .nf-audit-trail__card {
      width: 100%;
      text-align: left;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: 10px;
      padding: 10px 12px;
      background: var(--nf-surface-card, #fff);
      cursor: pointer;
      color: inherit;
    }
    .nf-audit-trail__card:hover { border-color: var(--nf-border-focus, #3b82f6); }
    .nf-audit-trail__top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .nf-audit-trail__icon-wrap { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; }
    .nf-audit-trail__icon-wrap--green { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
    .nf-audit-trail__icon-wrap--blue { background: rgba(59, 130, 246, 0.15); color: #2563eb; }
    .nf-audit-trail__icon-wrap--amber { background: rgba(245, 158, 11, 0.15); color: #d97706; }
    .nf-audit-trail__icon-wrap--red { background: rgba(239, 68, 68, 0.15); color: #dc2626; }
    .nf-audit-trail__icon-wrap--gray { background: rgba(107, 114, 128, 0.15); color: #6b7280; }
    .nf-audit-trail__icon { font-size: 18px; width: 18px; height: 18px; }
    .nf-audit-trail__summary { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px; }
    .nf-audit-trail__actor { font-weight: 600; color: var(--nf-text-primary, #111827); }
    .nf-audit-trail__verb { color: var(--nf-text-secondary, #4b5563); font-size: 0.875rem; }
    .nf-audit-trail__time { font-size: var(--nf-font-size-xs, 0.75rem); color: var(--nf-text-muted, #6b7280); margin-left: auto; flex-shrink: 0; }
    .nf-audit-trail__details { margin: 6px 0 0; color: var(--nf-text-muted, #6b7280); font-size: 0.8125rem; line-height: 1.4; }
  `],
})
export class AuditTrailComponent {
  entries = input<AuditTrailEntry[]>([]);
  title = input<string>('Audit Trail');
  searchEnabled = input<boolean>(true);
  searchPlaceholder = input<string>('audit.timeline.search');
  emptyLabel = input<string>('audit.timeline.empty');
  filterAllLabel = input<string>('audit.timeline.filter.all');
  filterCreatesLabel = input<string>('audit.timeline.filter.creates');
  filterUpdatesLabel = input<string>('audit.timeline.filter.updates');
  filterStatusChangesLabel = input<string>('audit.timeline.filter.statusChanges');
  filterDeletesLabel = input<string>('audit.timeline.filter.deletes');
  filterPublishLabel = input<string>('audit.timeline.filter.publish');
  filterApproveLabel = input<string>('audit.timeline.filter.approve');
  filterRejectLabel = input<string>('audit.timeline.filter.reject');
  filterLabel = input<string>('Filter');

  entryClick = output<AuditTrailEntry>();

  readonly query = signal('');
  readonly actionFilter = signal<AuditActionFilter>('');

  readonly showSearchAndFilter = computed(() => {
    if (!this.searchEnabled()) return false;
    return this.entries().length >= 5;
  });

  readonly filteredEntries = computed(() => {
    const term = this.query().trim().toLowerCase();
    const actionVal = this.actionFilter();
    let values = this.entries();

    if (actionVal) {
      values = values.filter((e) => e.action === actionVal);
    }
    if (!term) return values;

    return values.filter((entry) => {
      return (
        entry.actor.toLowerCase().includes(term) ||
        (entry.verb ?? entry.action).toLowerCase().includes(term) ||
        (entry.target || '').toLowerCase().includes(term) ||
        (entry.details || '').toLowerCase().includes(term)
      );
    });
  });

  onQueryInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.query.set(target?.value || '');
  }

  onEntryClick(entry: AuditTrailEntry): void {
    this.entryClick.emit(entry);
  }

  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  }
}
