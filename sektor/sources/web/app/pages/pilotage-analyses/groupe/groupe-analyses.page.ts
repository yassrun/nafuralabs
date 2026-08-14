import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';

import { PilotageAnalysesDataService } from '../services/pilotage-analyses-data.service';

@Component({
  selector: 'app-groupe-analyses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslateModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      @if (data.hydrated()) {
        @let g = data.groupe();
        @if (g) {
          <div class="kpi-strip" data-pilotage-loaded="true">
            <a class="kpi" routerLink="/pilotage-analyses/financier">
              <span>{{ 'dashboard.analyses.groupe.kpis.ca' | translate }}</span>
              <strong [attr.data-kpi-value]="g.ca">{{ g.ca | mad }}</strong>
            </a>
            <a class="kpi" routerLink="/pilotage-analyses/rentabilite">
              <span>{{ 'dashboard.analyses.groupe.kpis.marge' | translate }}</span>
              <strong [attr.data-kpi-value]="g.marge">{{ g.marge | mad }}</strong>
            </a>
            <a class="kpi" routerLink="/finance/balance">
              <span>{{ 'dashboard.analyses.groupe.kpis.ebitda' | translate }}</span>
              <strong [attr.data-kpi-value]="g.ebitdaApprox">{{ g.ebitdaApprox | mad }}</strong>
            </a>
            <a class="kpi" routerLink="/finance/balance">
              <span>{{ 'dashboard.analyses.groupe.kpis.bfrNet' | translate }}</span>
              <strong [attr.data-kpi-value]="g.tresorerieNet">{{ g.tresorerieNet | mad }}</strong>
            </a>
          </div>
          <p class="hint">{{ 'dashboard.analyses.groupe.hint' | translate }}</p>
        }
      } @else {
        <p class="loading">{{ 'dashboard.common.loading' | translate }}</p>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .kpi-strip { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem; }
    .kpi { padding: 0.75rem 1rem; background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; min-width: 160px; text-decoration: none; color: inherit; }
    .kpi span { display: block; font-size: 0.7rem; color: var(--nf-color-text-muted); text-transform: uppercase; margin-bottom: 0.15rem; }
    .kpi strong { font-size: 0.95rem; font-weight: 700; color: var(--nf-text-primary, var(--nf-color-text-primary)); }
    .hint { font-size: 0.8125rem; color: var(--nf-color-text-secondary); }
    .loading { color: var(--nf-color-text-secondary); }
  `],
})
export class GroupeAnalysesPage {
  readonly data = inject(PilotageAnalysesDataService);
  private readonly translate = inject(TranslateService);

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('dashboard.analyses.groupe.title'),
    subtitle: this.translate.instant('dashboard.analyses.groupe.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('dashboard.pilotage.breadcrumb') },
      { label: this.translate.instant('dashboard.analyses.breadcrumb') },
      { label: this.translate.instant('dashboard.analyses.groupe.breadcrumb') },
    ],
  }));
}
