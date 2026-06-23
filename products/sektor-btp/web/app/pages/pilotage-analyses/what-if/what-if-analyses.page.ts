import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';

import { CashFlowProjectionService } from '../../pilotage/services/cash-flow-projection.service';
import { PilotageAnalysesDataService } from '../services/pilotage-analyses-data.service';

@Component({
  selector: 'app-what-if-analyses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      @if (data.hydrated()) {
        <div class="controls" data-pilotage-loaded="true">
          <label>{{ 'dashboard.analyses.whatIf.controls.retardJours' | translate }}
            <input type="range" min="0" max="120" [value]="retardJours()" (input)="retardJours.set(+$any($event.target).value)" />
            {{ retardJours() }}
          </label>
          <label>{{ 'dashboard.analyses.whatIf.controls.impactOs' | translate }}
            <input type="range" min="0" max="15" [value]="impactOsPct()" (input)="impactOsPct.set(+$any($event.target).value)" />
            {{ impactOsPct() }}%
          </label>
          <label>{{ 'dashboard.analyses.whatIf.controls.hausseMatiere' | translate }}
            <input type="range" min="0" max="25" [value]="hausseMatierePct()" (input)="hausseMatierePct.set(+$any($event.target).value)" />
            {{ hausseMatierePct() }}%
          </label>
          <label>{{ 'dashboard.analyses.whatIf.controls.perteMarge' | translate }}
            <input type="range" min="0" max="30" [value]="perteMargePct()" (input)="perteMargePct.set(+$any($event.target).value)" />
            {{ perteMargePct() }}%
          </label>
        </div>
        <div class="compare">
          <article>
            <h3>{{ 'dashboard.analyses.whatIf.scenarioActuel' | translate }}</h3>
            <p>{{ 'dashboard.analyses.whatIf.margeBruteYtd' | translate }} : <strong>{{ baseMarge() | mad }}</strong></p>
            <p>{{ 'dashboard.analyses.whatIf.soldeCashflow' | translate }} : <strong>{{ baseCashFin() | mad }}</strong></p>
          </article>
          <article>
            <h3>{{ 'dashboard.analyses.whatIf.scenarioSimule' | translate }}</h3>
            <p>{{ 'dashboard.analyses.whatIf.margeBruteYtd' | translate }} : <strong>{{ simMarge() | mad }}</strong></p>
            <p>{{ 'dashboard.analyses.whatIf.soldeCashflow' | translate }} : <strong>{{ simCash() | mad }}</strong></p>
          </article>
        </div>
      } @else {
        <p class="loading">{{ 'dashboard.common.loading' | translate }}</p>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .controls { display: flex; flex-direction: column; gap: 1rem; max-width: 480px; margin-bottom: 1.5rem; }
    .controls label { display: flex; flex-direction: column; font-size: 0.875rem; color: var(--nf-color-text-secondary); gap: 0.25rem; }
    .compare { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    article { border: 1px solid var(--nf-color-border); border-radius: 0.75rem; padding: 1rem; background: var(--nf-color-surface); }
    h3 { margin: 0 0 0.5rem; font-size: 1rem; }
    .loading { color: var(--nf-color-text-secondary); }
    @media (max-width: 720px) { .compare { grid-template-columns: 1fr; } }
  `],
})
export class WhatIfAnalysesPage {
  readonly data = inject(PilotageAnalysesDataService);
  private readonly cash = inject(CashFlowProjectionService);
  private readonly translate = inject(TranslateService);

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('dashboard.analyses.whatIf.title'),
    subtitle: this.translate.instant('dashboard.analyses.whatIf.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('dashboard.pilotage.breadcrumb') },
      { label: this.translate.instant('dashboard.analyses.breadcrumb') },
      { label: this.translate.instant('dashboard.analyses.whatIf.breadcrumb') },
    ],
  }));

  readonly retardJours = signal(0);
  readonly impactOsPct = signal(0);
  readonly hausseMatierePct = signal(0);
  readonly perteMargePct = signal(0);

  readonly baseMarge = computed(() => this.data.rentabilite()?.margeBruteYtd ?? 0);

  readonly baseCashFin = computed(() => {
    const m = this.cash.months();
    return m.length ? m[m.length - 1].soldeCumule : 0;
  });

  readonly simMarge = computed(() => {
    const b = this.baseMarge();
    const r = this.retardJours();
    const os = this.impactOsPct();
    const mat = this.hausseMatierePct();
    const perte = this.perteMargePct();
    const facteurRetard = 1 - Math.min(0.25, r / 1200);
    const facteurOs = 1 - os / 100 * 0.7;
    const facteurMat = 1 - mat / 100 * 0.35;
    const facteurPerte = 1 - perte / 100;
    return Math.round(b * facteurRetard * facteurOs * facteurMat * facteurPerte);
  });

  readonly simCash = computed(() => {
    const base = this.baseCashFin();
    const stress = this.retardJours() * 12_000 + this.impactOsPct() * 80_000 + this.hausseMatierePct() * 25_000;
    return Math.round(base - stress);
  });
}
