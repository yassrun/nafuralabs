import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';

import { PilotageAnalysesDataService } from '../services/pilotage-analyses-data.service';

@Component({
  selector: 'app-rh-analyses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslateModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      @if (data.hydrated()) {
        @let r = data.rhKpis();
        <div class="kpi-strip" data-pilotage-loaded="true">
          <a class="kpi" routerLink="/rh/employes">
            <span>{{ 'dashboard.analyses.rh.kpis.effectif' | translate }}</span>
            <strong [attr.data-kpi-value]="r.effectif">{{ r.effectif }}</strong>
          </a>
          <a class="kpi" routerLink="/rh/paie">
            <span>{{ 'dashboard.analyses.rh.kpis.masseSalariale' | translate }}</span>
            <strong [attr.data-kpi-value]="r.masseSalarialeYtd">{{ r.masseSalarialeYtd | mad }}</strong>
          </a>
          <a class="kpi" routerLink="/rh/pointage">
            <span>{{ 'dashboard.analyses.rh.kpis.absenteisme' | translate }}</span>
            <strong [attr.data-kpi-value]="r.absenteismePct">{{ r.absenteismePct | number:'1.1-1' }}%</strong>
          </a>
          <a class="kpi" routerLink="/rh/employes">
            <span>{{ 'dashboard.analyses.rh.kpis.rotation' | translate }}</span>
            <strong [attr.data-kpi-value]="r.rotationPct">{{ r.rotationPct | number:'1.1-1' }}%</strong>
          </a>
          <a class="kpi" routerLink="/rh/employes">
            <span>{{ 'dashboard.analyses.rh.kpis.pyramide' | translate }}</span>
            <strong [attr.data-kpi-value]="r.pyramideJeunesPct">{{ r.pyramideJeunesPct | number:'1.1-1' }}%</strong>
          </a>
          <a class="kpi" routerLink="/rh/paie">
            <span>{{ 'dashboard.analyses.rh.kpis.heuresSup' | translate }}</span>
            <strong [attr.data-kpi-value]="r.heuresSupYtd">{{ r.heuresSupYtd | mad }}</strong>
          </a>
        </div>
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
    .loading { color: var(--nf-color-text-secondary); }
  `],
})
export class RhAnalysesPage {
  readonly data = inject(PilotageAnalysesDataService);
  private readonly translate = inject(TranslateService);

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('dashboard.analyses.rh.title'),
    subtitle: this.translate.instant('dashboard.analyses.rh.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('dashboard.pilotage.breadcrumb') },
      { label: this.translate.instant('dashboard.analyses.breadcrumb') },
      { label: this.translate.instant('dashboard.analyses.rh.breadcrumb') },
    ],
  }));
}
