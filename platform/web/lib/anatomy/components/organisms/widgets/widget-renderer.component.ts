import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiConfigService } from '../../../../../core/config/api-config.service';
import { DashboardPanelComponent } from '../../molecules/dashboard-panel/dashboard-panel.component';
import { KpiWidgetComponent } from './kpi-widget.component';
import { ChartWidgetComponent } from './chart-widget.component';
import { ListWidgetComponent } from './list-widget.component';
import { ActivityWidgetComponent } from './activity-widget.component';
import type { WidgetConfig } from './widget.types';

@Component({
  selector: 'nf-widget',
  standalone: true,
  imports: [
    CommonModule,
    DashboardPanelComponent,
    KpiWidgetComponent,
    ChartWidgetComponent,
    ListWidgetComponent,
    ActivityWidgetComponent,
  ],
  template: `
    <nf-dashboard-panel [title]="config().title" [span]="config().span">
      @if (loading()) {
        <div class="nf-widget-renderer__skeleton">
          <div class="nf-widget-renderer__skeleton-line nf-widget-renderer__skeleton-line--title"></div>
          <div class="nf-widget-renderer__skeleton-line nf-widget-renderer__skeleton-line--value"></div>
          <div class="nf-widget-renderer__skeleton-line"></div>
        </div>
      } @else if (error()) {
        <div class="nf-widget-renderer__error">
          <p class="nf-widget-renderer__error-message">{{ error() }}</p>
          <button type="button" class="nf-widget-renderer__retry" (click)="load()">
            Retry
          </button>
        </div>
      } @else {
        @switch (config().type) {
          @case ('kpi') {
            <nf-kpi-widget [config]="config()" [data]="data()" />
          }
          @case ('chart') {
            <nf-chart-widget [config]="config()" [data]="data()" />
          }
          @case ('list') {
            <nf-list-widget [config]="config()" [data]="data()" />
          }
          @case ('activity') {
            <nf-activity-widget [config]="config()" [data]="data()" />
          }
        }
      }
    </nf-dashboard-panel>
  `,
  styles: [
    `
      .nf-widget-renderer__skeleton {
        display: flex;
        flex-direction: column;
        gap: var(--nf-space-3, 12px);
        padding: var(--nf-space-2, 8px) 0;
      }

      .nf-widget-renderer__skeleton-line {
        height: 12px;
        border-radius: 6px;
        background: var(--nf-color-gray-200);
        animation: nf-widget-skeleton-pulse 1.5s ease-in-out infinite;
      }

      .nf-widget-renderer__skeleton-line--title {
        width: 60%;
        height: 16px;
      }

      .nf-widget-renderer__skeleton-line--value {
        width: 40%;
        height: 24px;
      }

      @keyframes nf-widget-skeleton-pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }

      .nf-widget-renderer__error {
        display: flex;
        flex-direction: column;
        gap: var(--nf-space-3, 12px);
        padding: var(--nf-space-2, 8px) 0;
      }

      .nf-widget-renderer__error-message {
        margin: 0;
        font-size: var(--nf-font-size-sm, 0.875rem);
        color: var(--nf-color-danger-600);
      }

      .nf-widget-renderer__retry {
        align-self: flex-start;
        padding: var(--nf-space-2, 8px) var(--nf-space-3, 12px);
        font-size: var(--nf-font-size-sm, 0.875rem);
        color: var(--nf-color-primary-600);
        background: transparent;
        border: 1px solid var(--nf-color-primary-500);
        border-radius: var(--nf-radius-md, 8px);
        cursor: pointer;
      }

      .nf-widget-renderer__retry:hover {
        background: var(--nf-color-primary-50);
      }
    `,
  ],
})
export class WidgetRendererComponent {
  readonly config = input.required<WidgetConfig>();

  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);
  private readonly destroyRef = inject(DestroyRef);

  readonly data = signal<Record<string, unknown> | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    });
    effect(() => {
      this.config();
      this.load();
      this.scheduleRefresh();
    });
  }

  private scheduleRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    const cfg = this.config();
    const intervalSec = cfg.dataSource.refreshInterval ?? 0;
    if (intervalSec <= 0) return;
    this.refreshTimer = setInterval(() => {
      void this.load(true);
    }, intervalSec * 1000);
  }

  load(silent = false): void {
    const cfg = this.config();
    if (!silent) {
      this.loading.set(true);
      this.error.set(null);
    }
    const url = this.buildUrl(cfg.dataSource.endpoint);
    const params = cfg.dataSource.params
      ? new HttpParams({ fromObject: cfg.dataSource.params })
      : undefined;

    this.http
      .get<Record<string, unknown>>(url, { params })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (body) => {
          this.data.set(body);
          this.loading.set(false);
          this.error.set(null);
        },
        error: (err) => {
          const message =
            err?.error?.message ?? err?.message ?? 'Failed to load';
          this.error.set(message);
          this.loading.set(false);
        },
      });
  }

  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    const base = this.apiConfig.apiBaseUrl();
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${path}`;
  }
}
