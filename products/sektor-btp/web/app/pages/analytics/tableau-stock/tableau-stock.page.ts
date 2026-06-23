import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';

import { PilotageAnalysesDataService } from '../../pilotage-analyses/services/pilotage-analyses-data.service';
import { ANALYTICS_PAGE_STYLES } from '../styles/analytics-page.styles';

@Component({
  selector: 'app-tableau-stock',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslateModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      @if (data.hydrated()) {
        @let s = data.stock();
        <div class="analytics-grid" data-analytics-loaded="true">
          <a class="analytics-kpi" routerLink="/inventory/suivi/valorisation">
            <span>{{ 'dashboard.analyses.stock.kpis.valeurStockTotale' | translate }}</span>
            <strong>{{ s.valeurStockTotale | mad }}</strong>
          </a>
          <a class="analytics-kpi" routerLink="/inventory/suivi/etat-stock">
            <span>{{ 'dashboard.analyses.stock.kpis.rotation' | translate }}</span>
            <strong>{{ s.rotationApprox | number:'1.0-0' }}</strong>
          </a>
          <a class="analytics-kpi" routerLink="/inventory/suivi/stock-balances">
            <span>{{ 'dashboard.analyses.stock.kpis.valeurCentral' | translate }}</span>
            <strong>{{ s.valeurCentral | mad }}</strong>
          </a>
          <a class="analytics-kpi" routerLink="/inventory/suivi/alertes">
            <span>{{ 'dashboard.analyses.stock.kpis.valeurChantier' | translate }}</span>
            <strong>{{ s.valeurChantier | mad }}</strong>
          </a>
        </div>
        <section class="analytics-chart-card">
          <h3 class="analytics-chart-card__title">{{ 'dashboard.analyses.stock.topArticles' | translate }}</h3>
          <ol class="analytics-list">
            @for (a of s.topArticles; track a.code) {
              <li><a routerLink="/inventory/catalogue/items">{{ a.code }}</a> — {{ a.name }} ({{ a.qty | number:'1.0-0' }})</li>
            } @empty {
              <li>{{ 'dashboard.analyses.stock.empty' | translate }}</li>
            }
          </ol>
        </section>
      } @else {
        <p class="loading-msg">{{ 'erp.analyticsTableau.common.loading' | translate }}</p>
      }
    </nf-page-shell>
  `,
  styles: [
    ANALYTICS_PAGE_STYLES,
    `
      .analytics-kpi {
        display: block;
        padding: 1rem;
        border: 1px solid var(--nf-color-border);
        border-radius: 0.75rem;
        background: var(--nf-color-surface);
        text-decoration: none;
        color: inherit;
      }
      .analytics-kpi span {
        display: block;
        font-size: 0.75rem;
        color: var(--nf-color-text-muted);
        margin-bottom: 0.25rem;
      }
      .analytics-kpi strong {
        font-size: 1.1rem;
        font-weight: 700;
      }
      .analytics-list {
        margin: 0;
        padding-left: 1.25rem;
      }
    `,
  ],
})
export class TableauStockPage {
  readonly data = inject(PilotageAnalysesDataService);
  private readonly translate = inject(TranslateService);

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('erp.analyticsTableau.stock.title'),
    breadcrumbs: [
      { label: this.translate.instant('erp.analyticsTableau.common.breadcrumb'), route: '/analytics' },
      { label: this.translate.instant('erp.analyticsTableau.stock.breadcrumb') },
    ],
  }));
}
