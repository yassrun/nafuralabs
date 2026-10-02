import { CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { DataStateComponent } from '@lib/anatomy/components/molecules/data-state';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  pricePerMonth: number | null;
  currency: string | null;
  isCurrent: boolean;
}

interface UsageMetric {
  key: string;
  label: string;
  used: number;
  limit: number | null;
}

interface SubscriptionOverview {
  currentPlan: SubscriptionPlan | null;
  availablePlans: SubscriptionPlan[];
  metrics: UsageMetric[];
}

const API = '/api/v1/administration/subscriptions';

@Component({
  selector: 'app-subscriptions-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, PageShellComponent, PageHeaderComponent, DataStateComponent, TranslateModule],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig"></nf-page-header>

      <nf-data-state
        [state]="state()"
        loadingVariant="inline"
        [errorMessage]="'administration.subscriptions.loadError' | translate"
        (retry)="load()">
        @if (overview(); as data) {
          <section class="panel panel--current" aria-labelledby="sub-current">
            <h2 id="sub-current">{{ 'administration.subscriptions.currentPlan' | translate }}</h2>
            @if (data.currentPlan; as plan) {
              <p class="plan-name">{{ plan.name }}</p>
              @if (plan.description) {
                <p class="muted">{{ plan.description }}</p>
              }
            } @else {
              <p class="plan-name">{{ 'administration.subscriptions.noPlan' | translate }}</p>
              <p class="muted">{{ 'administration.subscriptions.noPlanHint' | translate }}</p>
            }
          </section>

          <section class="panel" aria-labelledby="sub-usage">
            <h2 id="sub-usage">{{ 'administration.subscriptions.usage' | translate }}</h2>
            <div class="metrics">
              @for (metric of data.metrics; track metric.key) {
                <article class="metric-card">
                  <div class="metric-label">{{ ('administration.subscriptions.metrics.' + metric.key) | translate }}</div>
                  <div class="metric-value">
                    {{ metric.used }}
                    @if (metric.limit !== null) {
                      <span class="muted"> / {{ metric.limit }}</span>
                    } @else {
                      <span class="muted"> · {{ 'administration.subscriptions.unlimited' | translate }}</span>
                    }
                  </div>
                  @if (metric.limit !== null) {
                    <div class="progress" role="progressbar" [attr.aria-valuenow]="percent(metric)" aria-valuemin="0" aria-valuemax="100"
                         [attr.aria-label]="('administration.subscriptions.metrics.' + metric.key) | translate">
                      <div class="progress__fill" [class]="'progress__fill progress__fill--' + level(metric)" [style.width.%]="percent(metric)"></div>
                    </div>
                  }
                </article>
              } @empty {
                <p class="muted">{{ 'administration.subscriptions.noUsage' | translate }}</p>
              }
            </div>
          </section>

          @if (data.availablePlans.length) {
            <section class="panel" aria-labelledby="sub-plans">
              <h2 id="sub-plans">{{ 'administration.subscriptions.plans' | translate }}</h2>
              <ul class="plans">
                @for (plan of data.availablePlans; track plan.id) {
                  <li class="plan" [class.plan--current]="plan.isCurrent">
                    <span class="plan__name">{{ plan.name }}</span>
                    @if (plan.pricePerMonth !== null) {
                      <span class="muted">{{ plan.pricePerMonth | currency: (plan.currency || 'MAD') }} / {{ 'administration.subscriptions.month' | translate }}</span>
                    }
                  </li>
                }
              </ul>
            </section>
          }
        }
      </nf-data-state>
    </nf-page-shell>
  `,
  styles: [
    `
      :host { display: block; height: 100%; }
      .panel {
        background: var(--nf-surface-card, #fff);
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: var(--nf-radius-lg, 12px);
        padding: var(--nf-space-5, 20px);
        margin-bottom: var(--nf-space-4, 16px);
      }
      .panel h2 { margin: 0 0 var(--nf-space-3, 12px); font-size: var(--nf-font-size-md, 1rem); font-weight: 600; }
      .plan-name { margin: 0 0 var(--nf-space-1, 4px); font-size: 1.25rem; font-weight: 600; }
      .muted { margin: 0; color: var(--nf-text-secondary, #64748b); font-weight: 400; }
      .metrics { display: grid; gap: var(--nf-space-3, 12px); grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
      .metric-card {
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: var(--nf-radius-md, 8px);
        padding: var(--nf-space-4, 16px);
        background: var(--nf-surface-section, #f8fafc);
      }
      .metric-label { color: var(--nf-text-secondary, #64748b); font-size: 0.85rem; margin-bottom: var(--nf-space-1, 4px); }
      .metric-value { font-size: 1.25rem; font-weight: 600; margin-bottom: var(--nf-space-2, 8px); }
      .progress { height: 8px; border-radius: 4px; background: var(--nf-color-gray-200, #e2e8f0); overflow: hidden; }
      .progress__fill { height: 100%; border-radius: 4px; }
      .progress__fill--ok { background: var(--nf-color-success-500, #22c55e); }
      .progress__fill--warn { background: var(--nf-color-warning-500, #f59e0b); }
      .progress__fill--full { background: var(--nf-color-danger-500, #ef4444); }
      .plans { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--nf-space-2, 8px); }
      .plan {
        display: flex; justify-content: space-between; gap: var(--nf-space-3, 12px);
        padding: var(--nf-space-3, 12px); border: 1px solid var(--nf-border-default, #e5e7eb); border-radius: var(--nf-radius-md, 8px);
      }
      .plan--current { border-color: var(--nf-color-primary-500, #3b82f6); }
      .plan__name { font-weight: 600; }
    `,
  ],
})
export class SubscriptionsPage {
  private readonly http = inject(HttpClient);

  readonly overview = signal<SubscriptionOverview | null>(null);
  readonly state = signal<'loading' | 'loaded' | 'error'>('loading');
  readonly headerConfig = {
    title: 'administration.subscriptions.title',
    subtitle: 'administration.subscriptions.subtitle',
    icon: 'layers',
  };

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.state.set('loading');
    try {
      this.overview.set(await firstValueFrom(this.http.get<SubscriptionOverview>(API)));
      this.state.set('loaded');
    } catch {
      this.state.set('error');
    }
  }

  percent(metric: UsageMetric): number {
    return metric.limit ? Math.min(100, Math.round((metric.used / metric.limit) * 100)) : 0;
  }

  level(metric: UsageMetric): 'ok' | 'warn' | 'full' {
    const pct = this.percent(metric);
    return pct < 70 ? 'ok' : pct <= 90 ? 'warn' : 'full';
  }
}
