import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import {
  PageHeaderComponent,
  PageShellComponent,
} from '@lib/anatomy';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';

const PLACEHOLDER_PLAN = {
  name: 'Free',
  description: 'Basic access for small teams',
  features: ['Up to 5 users', 'Up to 3 domains', 'Community support'],
} as const;

const PLACEHOLDER_METRICS = [
  { key: 'users', label: 'Users', used: 2, limit: 5 },
  { key: 'domains', label: 'Domains', used: 3, limit: 3 },
  { key: 'storage', label: 'Storage', used: 120, limit: 1024, unit: 'MB' },
] as const;

@Component({
  selector: 'app-subscriptions-page',
  standalone: true,
  imports: [
    CommonModule,
    PageShellComponent,
    PageHeaderComponent,
    TranslateModule,
    MatTooltipModule,
  ],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig"></nf-page-header>

      <!-- Section 1: Current Plan -->
      <section class="panel panel--current">
        <h2>{{ 'administration.subscriptions.currentPlan' | translate }}</h2>
        <p class="plan-name">{{ PLACEHOLDER_PLAN.name }}</p>
        <p class="plan-description">{{ PLACEHOLDER_PLAN.description }}</p>
        <p class="included-label">{{ 'administration.subscriptions.included' | translate }}</p>
        <ul class="feature-list">
          @for (feature of PLACEHOLDER_PLAN.features; track feature) {
            <li>{{ feature }}</li>
          }
        </ul>
      </section>

      <!-- Section 2: Usage -->
      <section class="panel">
        <h2>{{ 'administration.subscriptions.usage' | translate }}</h2>
        <div class="metrics">
          @for (m of PLACEHOLDER_METRICS; track m.key) {
            <article class="metric-card">
              <div class="metric-label">{{ m.label }}</div>
              <div class="metric-value">
                {{ formatMetricValue(m) }}
              </div>
              <div
                class="progress-bar"
                [class.progress-bar--green]="getProgressClass(m) === 'green'"
                [class.progress-bar--amber]="getProgressClass(m) === 'amber'"
                [class.progress-bar--red]="getProgressClass(m) === 'red'">
                <div
                  class="progress-fill"
                  [style.width.%]="getProgressPercent(m)">
                </div>
              </div>
            </article>
          }
        </div>
      </section>

      <!-- Section 3: Upgrade CTA -->
      <section class="panel">
        <h2>{{ 'administration.subscriptions.upgrade.title' | translate }}</h2>
        <p class="upgrade-description">
          {{ 'administration.subscriptions.upgrade.description' | translate }}
        </p>
        <span
          class="cta-wrapper"
          [matTooltip]="'administration.subscriptions.upgrade.comingSoon' | translate">
          <button
            type="button"
            class="cta-button"
            disabled>
            {{ 'administration.subscriptions.upgrade.cta' | translate }}
          </button>
        </span>
        <p class="coming-soon-text">
          {{ 'administration.subscriptions.upgrade.comingSoon' | translate }}
        </p>
      </section>
    </nf-page-shell>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      .panel {
        background: #ffffff;
        border: 1px solid #dbe3ee;
        border-radius: 12px;
        padding: 1.25rem;
        margin-bottom: 1.25rem;
      }

      .panel h2 {
        margin: 0 0 0.75rem;
        font-size: 1rem;
        font-weight: 600;
      }

      .panel--current {
        background: linear-gradient(180deg, #eff6ff, #ffffff);
      }

      .plan-name {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.25rem;
      }

      .plan-description {
        margin: 0 0 0.75rem;
        color: #475569;
      }

      .included-label {
        margin: 0 0 0.35rem;
        font-size: 0.9rem;
        color: #64748b;
      }

      .feature-list {
        margin: 0;
        padding-left: 1.25rem;
      }

      .feature-list li {
        margin-bottom: 0.25rem;
      }

      .metrics {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      }

      .metric-card {
        border: 1px solid #dbe3ee;
        border-radius: 10px;
        padding: 1rem;
        background: #f8fafc;
      }

      .metric-label {
        color: #475569;
        font-size: 0.85rem;
        margin-bottom: 0.35rem;
      }

      .metric-value {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }

      .progress-bar {
        height: 8px;
        border-radius: 4px;
        background: #e2e8f0;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.2s ease;
      }

      .progress-bar--green .progress-fill {
        background: #22c55e;
      }

      .progress-bar--amber .progress-fill {
        background: #f59e0b;
      }

      .progress-bar--red .progress-fill {
        background: #ef4444;
      }

      .upgrade-description {
        margin: 0 0 1rem;
        color: #475569;
      }

      .cta-wrapper {
        display: inline-block;
        margin-bottom: 1rem;
      }

      .cta-button {
        border: 1px solid #cbd5e1;
        background: #f1f5f9;
        color: #64748b;
        border-radius: 8px;
        padding: 0.5rem 1rem;
        font-size: 0.95rem;
        cursor: not-allowed;
      }

      .coming-soon-text {
        margin: 0;
        font-size: 0.9rem;
        color: #64748b;
      }
    `,
  ],
})
export class SubscriptionsPage {
  readonly PLACEHOLDER_PLAN = PLACEHOLDER_PLAN;
  readonly PLACEHOLDER_METRICS = PLACEHOLDER_METRICS;

  readonly headerConfig = {
    title: 'administration.subscriptions.title',
    subtitle: 'administration.subscriptions.subtitle',
    icon: 'layers',
  };

  getProgressPercent(m: (typeof PLACEHOLDER_METRICS)[number]): number {
    if (m.limit <= 0) return 0;
    return Math.min(100, (m.used / m.limit) * 100);
  }

  getProgressClass(m: (typeof PLACEHOLDER_METRICS)[number]): 'green' | 'amber' | 'red' {
    const pct = this.getProgressPercent(m);
    if (pct < 70) return 'green';
    if (pct <= 90) return 'amber';
    return 'red';
  }

  formatMetricValue(m: (typeof PLACEHOLDER_METRICS)[number]): string {
    const unit = 'unit' in m ? m.unit : '';
    if (unit === 'MB') {
      return `${m.used} ${unit} / ${m.limit} GB`;
    }
    return `${m.used} / ${m.limit}`;
  }
}
