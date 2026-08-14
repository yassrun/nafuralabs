import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';

import { PilotageAnalysesDataService } from '../services/pilotage-analyses-data.service';

@Component({
  selector: 'app-achats-analyses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslateModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      @if (data.hydrated()) {
        @let a = data.achatsKpis();
        <div class="kpi-strip" data-pilotage-loaded="true">
          <a class="kpi" routerLink="/achats/commandes">
            <span>{{ 'dashboard.analyses.achats.kpis.volumeYtd' | translate }}</span>
            <strong [attr.data-kpi-value]="a.volumeYtdHt">{{ a.volumeYtdHt | mad }}</strong>
          </a>
          <a class="kpi" routerLink="/achats/commandes">
            <span>{{ 'dashboard.analyses.achats.kpis.nbBc' | translate }}</span>
            <strong [attr.data-kpi-value]="a.nbBc">{{ a.nbBc }}</strong>
          </a>
          <a class="kpi" routerLink="/achats/fournisseurs">
            <span>{{ 'dashboard.analyses.achats.kpis.economiesVsMarche' | translate }}</span>
            <strong [attr.data-kpi-value]="a.economiesVsMarchePct">{{ a.economiesVsMarchePct | number:'1.1-1' }}%</strong>
          </a>
          <a class="kpi" routerLink="/achats/fournisseurs">
            <span>{{ 'dashboard.analyses.achats.kpis.dependanceMax' | translate }}</span>
            <strong [attr.data-kpi-value]="a.dependanceMaxPct">{{ a.dependanceMaxPct | number:'1.1-1' }}%</strong>
          </a>
        </div>
        <section class="panel">
          <h2>{{ 'dashboard.analyses.achats.topFournisseurs' | translate }}</h2>
          <ul>
            @for (f of a.topFournisseurs; track f.nom) {
              <li>{{ f.nom }} — {{ f.volumeHt | mad }}</li>
            }
          </ul>
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
export class AchatsAnalysesPage {
  readonly data = inject(PilotageAnalysesDataService);
  private readonly translate = inject(TranslateService);

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('dashboard.analyses.achats.title'),
    subtitle: this.translate.instant('dashboard.analyses.achats.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('dashboard.pilotage.breadcrumb') },
      { label: this.translate.instant('dashboard.analyses.breadcrumb') },
      { label: this.translate.instant('dashboard.analyses.achats.breadcrumb') },
    ],
  }));
}
