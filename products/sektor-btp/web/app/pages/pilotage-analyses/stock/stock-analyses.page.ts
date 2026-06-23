import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';

import { PilotageAnalysesDataService } from '../services/pilotage-analyses-data.service';

@Component({
  selector: 'app-stock-analyses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslateModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      @if (data.hydrated()) {
        @let s = data.stock();
        <div class="kpi-strip" data-pilotage-loaded="true">
          <a class="kpi" routerLink="/inventory/suivi/valorisation">
            <span>{{ 'dashboard.analyses.stock.kpis.valeurStockTotale' | translate }}</span>
            <strong [attr.data-kpi-value]="s.valeurStockTotale">{{ s.valeurStockTotale | mad }}</strong>
          </a>
          <a class="kpi" routerLink="/inventory/suivi/etat-stock">
            <span>{{ 'dashboard.analyses.stock.kpis.rotation' | translate }}</span>
            <strong [attr.data-kpi-value]="s.rotationApprox">{{ s.rotationApprox | number:'1.0-0' }}</strong>
          </a>
          <a class="kpi" routerLink="/inventory/magasin-chantier/ch-001">
            <span>{{ 'dashboard.analyses.stock.kpis.valeurChantier' | translate }}</span>
            <strong [attr.data-kpi-value]="s.valeurChantier">{{ s.valeurChantier | mad }}</strong>
          </a>
          <a class="kpi" routerLink="/inventory/suivi/stock-balances">
            <span>{{ 'dashboard.analyses.stock.kpis.valeurCentral' | translate }}</span>
            <strong [attr.data-kpi-value]="s.valeurCentral">{{ s.valeurCentral | mad }}</strong>
          </a>
        </div>
        <section class="panel">
          <h2>{{ 'dashboard.analyses.stock.topArticles' | translate }}</h2>
          <ol>
            @for (a of s.topArticles; track a.code) {
              <li><a routerLink="/inventory/catalogue/items">{{ a.code }}</a> — {{ a.name }} ({{ a.qty | number:'1.0-0' }})</li>
            } @empty {
              <li>{{ 'dashboard.analyses.stock.empty' | translate }}</li>
            }
          </ol>
        </section>
      } @else {
        <p class="loading">{{ 'dashboard.common.loading' | translate }}</p>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .kpi-strip { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem; }
    .kpi { padding: 0.75rem 1rem; background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; min-width: 150px; text-decoration: none; color: inherit; }
    .kpi span { display: block; font-size: 0.7rem; color: var(--nf-color-text-muted); text-transform: uppercase; margin-bottom: 0.15rem; }
    .kpi strong { font-size: 0.95rem; font-weight: 700; color: var(--nf-text-primary, var(--nf-color-text-primary)); }
    .panel { padding: 1rem; border: 1px solid var(--nf-color-border); border-radius: 0.75rem; background: var(--nf-color-surface); }
    .loading { color: var(--nf-color-text-secondary); }
  `],
})
export class StockAnalysesPage {
  readonly data = inject(PilotageAnalysesDataService);
  private readonly translate = inject(TranslateService);

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('dashboard.analyses.stock.title'),
    subtitle: this.translate.instant('dashboard.analyses.stock.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('dashboard.pilotage.breadcrumb') },
      { label: this.translate.instant('dashboard.analyses.breadcrumb') },
      { label: this.translate.instant('dashboard.analyses.stock.breadcrumb') },
    ],
  }));
}
