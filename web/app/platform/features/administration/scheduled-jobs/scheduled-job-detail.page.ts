import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  PageHeaderComponent,
  PageShellComponent,
  ToastService,
} from '@lib/anatomy';
import type { JobExecution, ScheduledJobSummary } from './scheduled-jobs.models';
import { ScheduledJobsFacade } from './scheduled-jobs.facade';
import { CronDescriptionPipe } from '@lib/anatomy/pipes/cron-description.pipe';

@Component({
  selector: 'app-scheduled-job-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    PageShellComponent,
    PageHeaderComponent,
    TranslateModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
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
          <div class="left">
            <h2>
              {{ 'administration.scheduledJobs.detail.executions' | translate }}
            </h2>
            <p class="subtitle">
              {{ job()?.cron | cronDescription }}
            </p>
          </div>
          <div class="right">
            <mat-form-field appearance="outline">
              <mat-select
                [value]="statusFilter()"
                (valueChange)="onStatusFilterChange($event)"
                [placeholder]="'common.filters.status' | translate">
                <mat-option value="all">
                  {{ 'common.filters.all' | translate }}
                </mat-option>
                <mat-option value="SUCCESS">
                  {{ 'common.status.success' | translate }}
                </mat-option>
                <mat-option value="FAILED">
                  {{ 'common.status.failed' | translate }}
                </mat-option>
                <mat-option value="RUNNING">
                  {{ 'common.status.running' | translate }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              type="button"
              (click)="onRunNow()">
              <mat-icon>play_arrow</mat-icon>
              {{ 'administration.scheduledJobs.actions.runNow' | translate }}
            </button>
          </div>
        </section>

        <section class="table">
          <table>
            <thead>
              <tr>
                <th>
                  {{ 'administration.scheduledJobs.detail.columns.started' | translate }}
                </th>
                <th>
                  {{ 'administration.scheduledJobs.detail.columns.ended' | translate }}
                </th>
                <th>
                  {{ 'administration.scheduledJobs.detail.columns.duration' | translate }}
                </th>
                <th>
                  {{ 'administration.scheduledJobs.detail.columns.status' | translate }}
                </th>
                <th>
                  {{ 'administration.scheduledJobs.detail.columns.tenant' | translate }}
                </th>
                <th>
                  {{ 'administration.scheduledJobs.detail.columns.error' | translate }}
                </th>
              </tr>
            </thead>
            <tbody>
              @if (executions().length === 0) {
                <tr>
                  <td colspan="6" class="empty">
                    {{ 'common.empty.noResults' | translate }}
                  </td>
                </tr>
              } @else {
                @for (exec of executions(); track exec.id) {
                  <tr>
                    <td>{{ exec.startedAt | date: 'short' }}</td>
                    <td>{{ exec.endedAt ? (exec.endedAt | date: 'short') : '—' }}</td>
                    <td>{{ formatDuration(exec.durationMs) }}</td>
                    <td>
                      <span class="badge" [ngClass]="statusClass(exec.status)">
                        {{ exec.status }}
                      </span>
                    </td>
                    <td>{{ exec.tenantId || 'System' }}</td>
                    <td>
                      @if (exec.errorMessage) {
                        <details>
                          <summary>{{ exec.errorMessage | slice: 0:80 }}</summary>
                          <pre>{{ exec.errorMessage }}</pre>
                        </details>
                      } @else {
                        —
                      }
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </section>
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
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .toolbar .subtitle {
        margin: 0.25rem 0 0;
        font-size: 0.85rem;
        color: #64748b;
      }

      .toolbar .right {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .table {
        border-radius: 0.75rem;
        border: 1px solid #e2e8f0;
        overflow: auto;
        background: #ffffff;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      thead {
        background: #f8fafc;
      }

      th,
      td {
        padding: 0.75rem 0.875rem;
        text-align: left;
        font-size: 0.875rem;
        border-bottom: 1px solid #e2e8f0;
      }

      th {
        font-weight: 600;
        color: #64748b;
        white-space: nowrap;
      }

      tbody tr:last-child td {
        border-bottom: none;
      }

      .empty {
        text-align: center;
        padding: 1.5rem;
        color: #64748b;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .badge--success {
        background: #dcfce7;
        color: #15803d;
      }

      .badge--failed {
        background: #fee2e2;
        color: #b91c1c;
      }

      .badge--running {
        background: #dbeafe;
        color: #1d4ed8;
      }

      details summary {
        cursor: pointer;
        list-style: none;
        outline: none;
      }

      details summary::-webkit-details-marker {
        display: none;
      }

      details pre {
        margin-top: 0.5rem;
        white-space: pre-wrap;
        font-size: 0.78rem;
        background: #f8fafc;
        padding: 0.5rem;
        border-radius: 0.5rem;
      }
    `,
  ],
})
export class ScheduledJobDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(ScheduledJobsFacade);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  readonly key = signal<string | null>(null);
  readonly job = signal<ScheduledJobSummary | null>(null);
  readonly executions = this.facade.executions;

  readonly statusFilter = signal<string>('all');

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
      await this.facade.loadExecutions(key, { page: 0, size: 20 });
    } catch {
      this.toast.error(
        this.i18n.instant('common.errors.operationFailed') ||
          'Failed to load job'
      );
    }
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter.set(value || 'all');
    const key = this.key();
    if (!key) return;
    const status = value === 'all' ? undefined : value;
    void this.facade.loadExecutions(key, {
      page: 0,
      size: 20,
      status,
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
      await this.facade.loadExecutions(key, { page: 0, size: 20 });
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

  statusClass(status: JobExecution['status']): string {
    switch (status) {
      case 'SUCCESS':
        return 'badge--success';
      case 'FAILED':
        return 'badge--failed';
      case 'RUNNING':
        return 'badge--running';
      default:
        return '';
    }
  }
}

