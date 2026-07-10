/**
 * Polymorphic audit timeline panel – embeddable in any detail view.
 * Inputs: entityType, entityId. Loads 20 entries per page, "Load more" for next page.
 * Optional: active input to load only when tab/panel is visible.
 */

import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuditApiService, AuditEventDto } from '../services/audit-api.service';
import { AuditTrailComponent, AuditTrailEntry } from '../../../../lib/anatomy/components/organisms/audit-trail/audit-trail.component';

const PAGE_SIZE = 20;

/** Action type to icon (Material) and icon color class. */
const ACTION_META: Record<string, { icon: string; iconClass: string }> = {
  create: { icon: 'add_circle', iconClass: 'nf-audit-trail__icon-wrap--green' },
  update: { icon: 'edit', iconClass: 'nf-audit-trail__icon-wrap--blue' },
  status_change: { icon: 'arrow_forward', iconClass: 'nf-audit-trail__icon-wrap--amber' },
  delete: { icon: 'delete', iconClass: 'nf-audit-trail__icon-wrap--red' },
  publish: { icon: 'send', iconClass: 'nf-audit-trail__icon-wrap--green' },
  approve: { icon: 'check_circle', iconClass: 'nf-audit-trail__icon-wrap--green' },
  reject: { icon: 'cancel', iconClass: 'nf-audit-trail__icon-wrap--red' },
  assign: { icon: 'person_add', iconClass: 'nf-audit-trail__icon-wrap--blue' },
  comment: { icon: 'comment', iconClass: 'nf-audit-trail__icon-wrap--gray' },
  attach: { icon: 'attach_file', iconClass: 'nf-audit-trail__icon-wrap--gray' },
};

@Component({
  selector: 'nf-audit-timeline',
  standalone: true,
  imports: [CommonModule, TranslateModule, AuditTrailComponent],
  template: `
    <nf-audit-trail
      [entries]="entries()"
      [title]="titleKey()"
      [searchEnabled]="true"
      [searchPlaceholder]="searchPlaceholderKey()"
      [emptyLabel]="emptyKey()"
      [filterAllLabel]="filterAllKey()"
      [filterCreatesLabel]="filterCreatesKey()"
      [filterUpdatesLabel]="filterUpdatesKey()"
      [filterStatusChangesLabel]="filterStatusChangesKey()"
      [filterDeletesLabel]="filterDeletesKey()"
      [filterPublishLabel]="filterPublishKey()"
      [filterApproveLabel]="filterApproveKey()"
      [filterRejectLabel]="filterRejectKey()"
      (entryClick)="onEntryClick($event)"
    />
    @if (loading()) {
      <p class="nf-audit-timeline__loading">{{ loadingKey() | translate }}</p>
    }
    @if (error()) {
      <p class="nf-audit-timeline__error">{{ error() }}</p>
    }
    @if (hasMore() && !loading() && entries().length > 0) {
      <div class="nf-audit-timeline__load-more">
        <button type="button" class="nf-audit-timeline__load-more-btn" (click)="loadMore()">
          {{ loadMoreKey() | translate }}
        </button>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .nf-audit-timeline__loading, .nf-audit-timeline__error { margin: 8px 0; font-size: 0.875rem; }
    .nf-audit-timeline__error { color: var(--nf-color-danger-600, #b91c1c); }
    .nf-audit-timeline__load-more { margin-top: var(--nf-space-3, 12px); text-align: center; }
    .nf-audit-timeline__load-more-btn {
      padding: 8px 16px;
      font-size: 0.875rem;
      color: var(--nf-color-primary, #2563eb);
      background: transparent;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: 8px;
      cursor: pointer;
    }
    .nf-audit-timeline__load-more-btn:hover { background: var(--nf-surface-hover, #f3f4f6); }
  `],
})
export class AuditTimelineComponent {
  private readonly api = inject(AuditApiService);
  private readonly translate = inject(TranslateService);

  entityType = input.required<string>();
  entityId = input.required<string>();
  /** When false, does not load until set to true (e.g. tab active). */
  active = input<boolean>(true);
  titleKey = input<string>('audit.timeline.title');
  searchPlaceholderKey = input<string>('audit.timeline.search');
  emptyKey = input<string>('audit.timeline.empty');
  loadingKey = input<string>('audit.timeline.loading');
  loadMoreKey = input<string>('audit.timeline.loadMore');
  filterAllKey = input<string>('audit.timeline.filter.all');
  filterCreatesKey = input<string>('audit.timeline.filter.creates');
  filterUpdatesKey = input<string>('audit.timeline.filter.updates');
  filterStatusChangesKey = input<string>('audit.timeline.filter.statusChanges');
  filterDeletesKey = input<string>('audit.timeline.filter.deletes');
  filterPublishKey = input<string>('audit.timeline.filter.publish');
  filterApproveKey = input<string>('audit.timeline.filter.approve');
  filterRejectKey = input<string>('audit.timeline.filter.reject');

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly rawEvents = signal<AuditEventDto[]>([]);
  readonly currentPage = signal(0);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);

  readonly hasMore = computed(() => {
    const page = this.currentPage();
    const total = this.totalPages();
    return total > 0 && page < total - 1;
  });

  readonly entries = computed<AuditTrailEntry[]>(() => {
    const events = this.rawEvents();
    const translate = this.translate;
    return events.map((e) => {
      const meta = ACTION_META[e.action] ?? { icon: 'circle', iconClass: 'nf-audit-trail__icon-wrap--gray' };
      const verbKey = `audit.action.${e.action}`;
      const verb = translate.instant(verbKey) !== verbKey ? translate.instant(verbKey) : e.action;
      const details = buildDetailsLine(e);
      return {
        id: e.id,
        actor: e.actor,
        action: e.action,
        at: e.eventAt,
        details: details ?? e.details ?? undefined,
        target: undefined,
        verb,
        icon: meta.icon,
        iconClass: meta.iconClass,
      };
    });
  });

  constructor() {
    effect(() => {
      const et = this.entityType();
      const eid = this.entityId();
      const active = this.active();
      if (active && et && eid) {
        this.loadFirstPage(et, eid);
      }
    });
  }

  private loadFirstPage(entityType: string, entityId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.currentPage.set(0);
    this.rawEvents.set([]);
    this.api.getAuditTimeline(entityType, entityId, 0, PAGE_SIZE).subscribe({
      next: (page) => {
        this.rawEvents.set(page.content ?? []);
        this.totalElements.set(page.totalElements ?? 0);
        this.totalPages.set(
          page.totalPages ?? (Math.ceil((page.totalElements ?? 0) / PAGE_SIZE) || 1)
        );
        this.currentPage.set(page.number ?? 0);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to load audit timeline');
        this.loading.set(false);
      },
    });
  }

  loadMore(): void {
    const et = this.entityType();
    const eid = this.entityId();
    const nextPage = this.currentPage() + 1;
    if (!et || !eid) return;
    this.loading.set(true);
    this.api.getAuditTimeline(et, eid, nextPage, PAGE_SIZE).subscribe({
      next: (page) => {
        this.rawEvents.update((prev) => [...prev, ...(page.content ?? [])]);
        this.currentPage.set(page.number ?? nextPage);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to load more');
        this.loading.set(false);
      },
    });
  }

  onEntryClick(_entry: AuditTrailEntry): void {}
}

function buildDetailsLine(e: AuditEventDto): string | undefined {
  const changes = e.payload?.['changes'] as Array<{ field?: string; from?: unknown; to?: unknown }> | undefined;
  if (Array.isArray(changes) && changes.length > 0) {
    if (e.action === 'status_change' && changes.length === 1 && changes[0].field === 'status') {
      return `${changes[0].from} → ${changes[0].to}`;
    }
    return changes.map((c) => `${c.field}: ${c.from} → ${c.to}`).join(', ');
  }
  return undefined;
}
