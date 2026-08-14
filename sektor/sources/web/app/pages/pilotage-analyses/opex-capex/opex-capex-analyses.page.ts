import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';

import { PilotageAnalysesDataService } from '../services/pilotage-analyses-data.service';

@Component({
  selector: 'app-opex-capex-analyses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslateModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      @if (data.hydrated()) {
        @let x = data.opexCapex();
        @if (x) {
          <div class="kpi-strip" data-pilotage-loaded="true">
            <a class="kpi" routerLink="/finance/analytique" [queryParams]="{ classe: 6 }">
              <span>{{ 'dashboard.analyses.opexCapex.kpis.opex' | translate }}</span>
              <strong [attr.data-kpi-value]="x.opexMouv">{{ x.opexMouv | mad }}</strong>
            </a>
            <a class="kpi" routerLink="/finance/analytique" [queryParams]="{ classe: 2 }">
              <span>{{ 'dashboard.analyses.opexCapex.kpis.capex' | translate }}</span>
              <strong [attr.data-kpi-value]="x.capexMouv">{{ x.capexMouv | mad }}</strong>
            </a>
          </div>
        }
      } @else {
        <p class="loading">{{ 'dashboard.common.loading' | translate }}</p>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .kpi-strip { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .kpi { padding: 0.75rem 1rem; background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; min-width: 180px; text-decoration: none; color: inherit; }
    .kpi span { display: block; font-size: 0.7rem; color: var(--nf-color-text-muted); text-transform: uppercase; margin-bottom: 0.15rem; }
    .kpi strong { font-size: 0.95rem; font-weight: 700; color: var(--nf-text-primary, var(--nf-color-text-primary)); }
    .loading { color: var(--nf-color-text-secondary); }
  `],
})
export class OpexCapexAnalysesPage {
  readonly data = inject(PilotageAnalysesDataService);
  private readonly translate = inject(TranslateService);

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('dashboard.analyses.opexCapex.title'),
    subtitle: this.translate.instant('dashboard.analyses.opexCapex.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('dashboard.pilotage.breadcrumb') },
      { label: this.translate.instant('dashboard.analyses.breadcrumb') },
      { label: this.translate.instant('dashboard.analyses.opexCapex.breadcrumb') },
    ],
  }));
}
