import { CommonModule, formatDate } from '@angular/common';
import { Component, LOCALE_ID, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ConfirmDialogService,
  ListingFlatComponent,
  PageHeaderComponent,
  PageShellComponent,
  ToastService,
  type ListingFlatConfig,
} from '@lib/anatomy';
import type { ListingQueryState } from '@lib/anatomy/types';
import type { JobExecution, ScheduledJobSummary } from './scheduled-jobs.models';
import { ScheduledJobsFacade } from './scheduled-jobs.facade';
import { CronDescriptionPipe } from '@lib/anatomy/pipes/cron-description.pipe';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-scheduled-job-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    PageShellComponent,
    PageHeaderComponent,
    TranslateModule,
    ListingFlatComponent,
    CronDescriptionPipe,
  ],
  template: `
    <nf-page-shell>
      <nf-page-header [config]="{ title: headerTitle() }"></nf-page-header>

      @if (job()) {
        <section class="summary">
          <article class="card">
            <h3>{{ 'administration.scheduledJobs.detail.totalRuns' | translate }}</h3>
            <p>{{ totalRuns() }}</p>
          </article>
          <article class="card">
            <h3>{{ 'administration.scheduledJobs.detail.successRate' | translate }}</h3>
            <p>{{ successRate() }}%</p>
          </article>
          <article class="card">
            <h3>{{ 'administration.scheduledJobs.detail.avgDuration' | translate }}</h3>
            <p>{{ avgDuration() }}</p>
          </article>
          <article class="card">
            <h3>{{ 'administration.scheduledJobs.detail.lastRun' | translate }}</h3>
            <p>{{ lastRunRelative() }}</p>
          </article>
        </section>

        <section class="toolbar">
          <h2>
            {{ 'administration.scheduledJobs.detail.executions' | translate }}
          </h2>
          <p class="subtitle">
            {{ job()?.cron | cronDescription }}
          </p>
        </section>

        <nf-listing-flat
          class="executions"
          [config]="listing"
          [items]="executions()"
          [remote]="true"
          [remoteTotal]="totalRuns()"
          (load)="onLoad($event)"
          (actionClick)="onRunNow()"
          (rowDblClick)="showError($event)" />
      } @else {
        <p class="empty">
          {{ 'common.empty.loading' | translate }}
        </p>
      }
    </nf-page-shell>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .card {
        padding: 1rem;
        border-radius: 0.75rem;
        border: 1px solid #e2e8f0;
        background: #ffffff;
      }

      .card h3 {
        margin: 0 0 0.35rem;
        font-size: 0.9rem;
        color: #64748b;
      }

      .card p {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 600;
      }

      .toolbar {
        margin-bottom: 0.5rem;
      }

      .toolbar h2 {
        margin: 0;
      }

      .toolbar .subtitle {
        margin: 0.25rem 0 0;
        font-size: 0.85rem;
        color: #64748b;
      }

      .executions {
        display: block;
        min-height: 320px;
      }

      .empty {
        text-align: center;
        padding: 1.5rem;
        color: #64748b;
      }
    `,
  ],
})
export class ScheduledJobDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(ScheduledJobsFacade);
  private readonly toast = inject(ToastService);
  private readonly dialogs = inject(ConfirmDialogService);
  private readonly locale = inject(LOCALE_ID);
  private readonly i18n = inject(TranslateService);

  readonly listing: ListingFlatConfig = {
    columns: [
      { key: 'started', field: 'startedAt', label: 'administration.scheduledJobs.detail.columns.started', type: 'datetime' },
      { key: 'ended', field: 'endedAt', label: 'administration.scheduledJobs.detail.columns.ended', type: 'datetime' },
      { key: 'duration', field: 'durationMs', label: 'administration.scheduledJobs.detail.columns.duration', transform: (ms) => this.formatDuration(ms as number | null) },
      {
        key: 'status',
        field: 'status',
        label: 'administration.scheduledJobs.detail.columns.status',
        type: 'badge',
        transform: (status) => `common.status.${String(status).toLowerCase()}`,
        badgeVariant: (status) => ({ SUCCESS: 'success', FAILED: 'danger', RUNNING: 'info' } as const)[status as JobExecution['status']] ?? 'default',
      },
      { key: 'tenant', field: 'tenantId', label: 'administration.scheduledJobs.detail.columns.tenant', transform: (id) => (id ? String(id) : this.i18n.instant('administration.scheduledJobs.detail.systemTenant')) },
      { key: 'error', field: 'errorMessage', label: 'administration.scheduledJobs.detail.columns.error', transform: (error) => (error ? String(error).slice(0, 80) : '—') },
    ],
    pageSize: PAGE_SIZE,
    pageSizeOptions: [PAGE_SIZE],
    emptyMessage: 'common.empty.noResults',
    features: { search: false, filters: false, columnToggle: false, selection: 'none' },
    segments: [
      { id: 'all', label: 'common.filters.all' },
      { id: 'SUCCESS', label: 'common.status.success', filters: { status: 'SUCCESS' } },
      { id: 'FAILED', label: 'common.status.failed', filters: { status: 'FAILED' } },
      { id: 'RUNNING', label: 'common.status.running', filters: { status: 'RUNNING' } },
    ],
    actions: [{ id: 'run', label: 'administration.scheduledJobs.actions.runNow', icon: 'play', variant: 'primary' }],
  };

  readonly key = signal<string | null>(null);
  readonly job = signal<ScheduledJobSummary | null>(null);
  readonly executions = this.facade.executions;
  private readonly query = signal<{ page: number; status?: string }>({ page: 0 });

  readonly headerTitle = computed(() => {
    const j = this.job();
    if (!j) {
      return this.i18n.instant('administration.scheduledJobs.detail.title');
    }
    return `${j.description} (${j.key})`;
  });

  readonly totalRuns = computed(() => this.facade.executionsTotal());

  readonly successRate = computed(() => {
    const items = this.executions();
    if (!items.length) return 0;
    const successCount = items.filter((e) => e.status === 'SUCCESS').length;
    return Math.round((successCount / items.length) * 100);
  });

  readonly avgDuration = computed(() => {
    const items = this.executions().filter((e) => e.durationMs);
    if (!items.length) return '—';
    const total = items.reduce(
      (sum, e) => sum + (e.durationMs ?? 0),
      0
    );
    const avg = total / items.length;
    return this.formatDuration(avg);
  });

  readonly lastRunRelative = computed(() => {
    const last = this.executions()[0];
    if (!last) return '—';
    return new Date(last.startedAt).toLocaleString();
  });

  constructor() {
    effect(() => {
      const key = this.route.snapshot.paramMap.get('key');
      if (key) {
        this.key.set(key);
        this.init(key);
      }
    });
  }

  private async init(key: string): Promise<void> {
    try {
      if (!this.facade.jobs().length) {
        await this.facade.loadJobs();
      }
      const job = this.facade.jobs().find((j) => j.key === key) ?? null;
      this.job.set(job);
      await this.reload();
    } catch {
      this.toast.error(
        this.i18n.instant('common.errors.operationFailed') ||
          'Failed to load job'
      );
    }
  }

  onLoad(query: ListingQueryState): void {
    const status = query.segment && query.segment !== 'all' ? query.segment : undefined;
    this.query.set({ page: query.page - 1, status });
    void this.reload();
  }

  private async reload(): Promise<void> {
    const key = this.key();
    if (!key) return;
    await this.facade.loadExecutions(key, { size: PAGE_SIZE, ...this.query() });
  }

  async showError(execution: JobExecution): Promise<void> {
    if (!execution.errorMessage) return;
    await this.dialogs.reveal({
      title: this.i18n.instant('administration.scheduledJobs.detail.columns.error'),
      message: formatDate(execution.startedAt, 'medium', this.locale),
      value: execution.errorMessage,
    });
  }

  async onRunNow(): Promise<void> {
    const key = this.key();
    if (!key) return;
    try {
      await this.facade.runJobNow(key);
      this.toast.success(
        this.i18n.instant('administration.scheduledJobs.actions.runNowSuccess')
      );
      await this.reload();
    } catch {
      this.toast.error(
        this.i18n.instant('common.errors.operationFailed') ||
          'Failed to trigger job'
      );
    }
  }

  formatDuration(ms?: number | null): string {
    if (!ms || ms <= 0) return '—';
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    if (minutes < 60) {
      return `${minutes}m ${remaining}s`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
}

