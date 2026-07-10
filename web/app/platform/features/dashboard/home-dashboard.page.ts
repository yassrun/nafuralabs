/**
 * Home dashboard page – default landing after login.
 * Renders a config-driven grid of KPI, chart, activity, and list widgets.
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import {
  PageShellComponent,
  PageHeaderComponent,
  DashboardGridComponent,
  WidgetRendererComponent,
} from '@lib/anatomy/components';
import { ApiConfigService } from '@core/config/api-config.service';
import { HOME_DASHBOARD_CONFIG } from './home-dashboard.config';

interface DashboardSummary {
  totalRevenue?: number;
  revenueTrend?: number;
  invoiceCount?: number;
  overdueCount?: number;
  totalExpenses?: number;
  memberCount?: number;
  activeDomainsCount?: number;
}

@Component({
  selector: 'nf-home-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    PageShellComponent,
    PageHeaderComponent,
    DashboardGridComponent,
    WidgetRendererComponent,
  ],
  template: `
    <nf-page-shell [scroll]="true">
      <nf-page-header [config]="headerConfig()" />

      @if (showEmptyState()) {
        <section class="nf-home-dashboard__empty">
          <h2 class="nf-home-dashboard__empty-title">
            {{ 'dashboard.empty.title' | translate }}
          </h2>
          <p class="nf-home-dashboard__empty-message">
            {{ 'dashboard.empty.message' | translate }}
          </p>
          <ul class="nf-home-dashboard__empty-actions">
            <li>
              <a routerLink="/administration/members" class="nf-home-dashboard__empty-link">
                {{ 'dashboard.empty.inviteMembers' | translate }}
              </a>
            </li>
            <li>
              <a routerLink="/administration/domain-activation" class="nf-home-dashboard__empty-link">
                {{ 'dashboard.empty.activateDomains' | translate }}
              </a>
            </li>
            <li>
              <a routerLink="/administration/settings" class="nf-home-dashboard__empty-link">
                {{ 'dashboard.empty.configureSettings' | translate }}
              </a>
            </li>
          </ul>
        </section>
      }

      <nf-dashboard-grid>
        @for (widget of widgets; track widget.id) {
          <nf-widget [config]="widget" />
        }
      </nf-dashboard-grid>
    </nf-page-shell>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      .nf-home-dashboard__empty {
        margin-bottom: var(--nf-space-4, 16px);
        padding: var(--nf-space-4, 16px);
        border: 1px solid var(--nf-border-default);
        border-radius: var(--nf-radius-lg, 12px);
        background: var(--nf-surface-section);
      }

      .nf-home-dashboard__empty-title {
        margin: 0 0 var(--nf-space-2, 8px);
        font-size: var(--nf-font-size-lg, 1.125rem);
        font-weight: var(--nf-font-weight-semibold, 600);
        color: var(--nf-text-primary);
      }

      .nf-home-dashboard__empty-message {
        margin: 0 0 var(--nf-space-3, 12px);
        font-size: var(--nf-font-size-sm, 0.875rem);
        color: var(--nf-text-secondary);
      }

      .nf-home-dashboard__empty-actions {
        margin: 0;
        padding-left: 1.25rem;
      }

      .nf-home-dashboard__empty-actions li {
        margin-bottom: var(--nf-space-1, 4px);
      }

      .nf-home-dashboard__empty-link {
        color: var(--nf-color-primary-600);
        text-decoration: none;
      }

      .nf-home-dashboard__empty-link:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class HomeDashboardPage {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  readonly widgets = HOME_DASHBOARD_CONFIG;
  readonly showEmptyState = signal(false);

  headerConfig = () => ({
    title: 'dashboard.title',
    subtitle: 'dashboard.subtitle',
    icon: 'dashboard',
  });

  constructor() {
    this.checkEmptyState();
  }

  private checkEmptyState(): void {
    const base = this.apiConfig.apiBaseUrl();
    const url = `${base}/api/v1/dashboard/summary`;
    this.http.get<DashboardSummary>(url).subscribe({
      next: (data) => {
        const noRevenue = (data.totalRevenue ?? 0) === 0;
        const noInvoices = (data.invoiceCount ?? 0) === 0;
        const noMembers = (data.memberCount ?? 0) === 0;
        this.showEmptyState.set(noRevenue && noInvoices && noMembers);
      },
      error: () => {
        this.showEmptyState.set(false);
      },
    });
  }
}
