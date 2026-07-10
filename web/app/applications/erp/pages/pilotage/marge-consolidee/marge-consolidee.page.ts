import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { PilotageChantierMargesService } from '../services/pilotage-chantier-marges.service';

interface VilleAgg {
  ville: string;
  chantiers: number;
  portefeuilleHt: number;
  margeHt: number;
}

@Component({
  selector: 'app-marge-consolidee',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslateModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      <p class="intro">
        {{ 'dashboard.margeConsolidee.intro' | translate }}
        <a routerLink="/pilotage/marges-chantier" class="link">{{ 'dashboard.margeConsolidee.introLink' | translate }}</a>
        {{ 'dashboard.margeConsolidee.introDetail' | translate }}
      </p>

      <div class="kpi-strip">
        <article class="kpi kpi--wide">
          <span>{{ 'dashboard.margeConsolidee.kpis.portefeuille' | translate }}</span>
          <strong>{{ totals().portefeuille | mad }}</strong>
        </article>
        <article class="kpi">
          <span>{{ 'dashboard.margeConsolidee.kpis.factureHt' | translate }}</span>
          <strong>{{ totals().facture | mad }}</strong>
        </article>
        <article class="kpi">
          <span>{{ 'dashboard.margeConsolidee.kpis.encaisseHt' | translate }}</span>
          <strong>{{ totals().encaisse | mad }}</strong>
        </article>
        <article class="kpi">
          <span>{{ 'dashboard.margeConsolidee.kpis.tauxEncaisse' | translate }}</span>
          <strong>{{ totals().tauxEncaisse | number:'1.1-1' }}%</strong>
        </article>
        <article class="kpi">
          <span>{{ 'dashboard.margeConsolidee.kpis.margeProjetee' | translate }}</span>
          <strong [class.warn]="totals().margePct < 10" [class.ok]="totals().margePct >= 15">
            {{ totals().margePct | number:'1.1-1' }}%
          </strong>
        </article>
        <article class="kpi">
          <span>{{ 'dashboard.margeConsolidee.kpis.chantiersActifs' | translate }}</span>
          <strong>{{ totals().actifs }}</strong>
        </article>
      </div>

      <div class="two-cols">
        <section class="panel">
          <h2>{{ 'dashboard.margeConsolidee.risques.title' | translate }}</h2>
          <table>
            <thead>
              <tr>
                <th>{{ 'dashboard.margeConsolidee.risques.columns.chantier' | translate }}</th>
                <th class="num">{{ 'dashboard.margeConsolidee.risques.columns.marcheHt' | translate }}</th>
                <th class="center">{{ 'dashboard.margeConsolidee.risques.columns.margePct' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (r of risques(); track r.chantierId) {
                <tr [routerLink]="['/chantiers', r.chantierId]" class="clickable">
                  <td>
                    <span class="code">{{ r.chantierCode }}</span>
                    <span class="nom">{{ r.chantierNom }}</span>
                  </td>
                  <td class="num">{{ r.montantMarcheHt | mad }}</td>
                  <td class="center">
                    <span class="pill" [class.pill--danger]="r.margePct < 5" [class.pill--warn]="r.margePct >= 5 && r.margePct < 10">
                      {{ r.margePct | number:'1.1-1' }}%
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="3" class="empty">{{ 'dashboard.margeConsolidee.risques.empty' | translate }}</td></tr>
              }
            </tbody>
          </table>
        </section>

        <section class="panel">
          <h2>{{ 'dashboard.margeConsolidee.parVille.title' | translate }}</h2>
          <table>
            <thead>
              <tr>
                <th>{{ 'dashboard.margeConsolidee.parVille.columns.ville' | translate }}</th>
                <th class="center">{{ 'dashboard.margeConsolidee.parVille.columns.chantiers' | translate }}</th>
                <th class="num">{{ 'dashboard.margeConsolidee.parVille.columns.portefeuilleHt' | translate }}</th>
                <th class="num">{{ 'dashboard.margeConsolidee.parVille.columns.margeHt' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (v of parVille(); track v.ville) {
                <tr>
                  <td>{{ v.ville }}</td>
                  <td class="center">{{ v.chantiers }}</td>
                  <td class="num">{{ v.portefeuilleHt | mad }}</td>
                  <td class="num">{{ v.margeHt | mad }}</td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="empty">{{ 'dashboard.margeConsolidee.parVille.empty' | translate }}</td></tr>
              }
            </tbody>
          </table>
        </section>
      </div>

      <section class="panel panel--alertes">
        <h2>{{ 'dashboard.margeConsolidee.alertes.title' | translate }}</h2>
        <ul>
          <li>{{ 'dashboard.margeConsolidee.alertes.margeBasse' | translate: { count: totals().alertesMarge } }}</li>
          <li>{{ 'dashboard.margeConsolidee.alertes.ecartFactAv' | translate: { count: totals().alertesDiff } }}</li>
        </ul>
      </section>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .intro { font-size: 0.9rem; color: var(--nf-color-text-secondary); margin: 0 0 1rem; }
    .link { color: var(--nf-color-primary-500); font-weight: 600; text-decoration: none; }
    .link:hover { text-decoration: underline; }

    .kpi-strip { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .kpi { padding: 0.75rem 1rem; background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; min-width: 140px; }
    .kpi--wide { min-width: 200px; }
    .kpi span { display: block; font-size: 0.7rem; color: var(--nf-color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.15rem; }
    .kpi strong { font-size: 1rem; font-weight: 700; color: var(--nf-color-text-primary); }
    .kpi strong.warn { color: var(--nf-color-warning-600); }
    .kpi strong.ok { color: var(--nf-color-success-700); }

    .two-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .panel { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; padding: 1rem 1.25rem; }
    .panel h2 { margin: 0 0 0.75rem; font-size: 0.8rem; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    .panel--alertes ul { margin: 0; padding-left: 1.2rem; color: var(--nf-color-text-primary); font-size: 0.9rem; line-height: 1.6; }

    table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    th { text-align: left; padding: 0.5rem 0.4rem; color: var(--nf-color-text-secondary); font-weight: 600; border-bottom: 2px solid var(--nf-color-border); }
    th.num { text-align: right; }
    th.center { text-align: center; }
    td { padding: 0.5rem 0.4rem; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.center { text-align: center; }
    .code { display: block; font-weight: 700; color: var(--nf-color-primary-700); font-size: 0.8rem; }
    .nom { font-size: 0.72rem; color: var(--nf-color-text-secondary); }
    .clickable { cursor: pointer; transition: background 80ms; }
    .clickable:hover { background: var(--nf-color-bg-subtle); }
    .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-weight: 700; font-size: 0.75rem; background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .pill--warn { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .pill--danger { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .empty { text-align: center; color: var(--nf-color-text-muted); padding: 1rem; }
  `],
})
export class MargeConsolideePage {
  private readonly pilotageMarges = inject(PilotageChantierMargesService);
  private readonly translate = inject(TranslateService);

  private readonly rows = this.pilotageMarges.rows;

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('dashboard.margeConsolidee.title'),
    subtitle: this.translate.instant('dashboard.margeConsolidee.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('dashboard.pilotage.breadcrumb') },
      { label: this.translate.instant('dashboard.margeConsolidee.breadcrumb') },
    ],
  }));

  readonly totals = computed(() => {
    const all = this.rows();
    const portefeuille = all.reduce((s, r) => s + r.montantMarcheHt, 0);
    const facture = all.reduce((s, r) => s + r.cumulFactureHt, 0);
    const encaisse = all.reduce((s, r) => s + r.cumulEncaisseHt, 0);
    const totalMarge = all.reduce((s, r) => s + r.margeProjeteeHt, 0);
    const margePct = portefeuille > 0 ? Math.round((totalMarge / portefeuille) * 1000) / 10 : 0;
    const tauxEncaisse = facture > 0 ? Math.round((encaisse / facture) * 1000) / 10 : 0;
    const actifs = all.filter((r) => r.status === 'EN_COURS').length;
    const alertesMarge = all.filter((r) => r.alerteMarge).length;
    const alertesDiff = all.filter((r) => r.alerteDiff).length;
    return { portefeuille, facture, encaisse, tauxEncaisse, margePct, actifs, alertesMarge, alertesDiff };
  });

  readonly risques = computed(() =>
    [...this.rows()]
      .filter((r) => r.margePct < 10)
      .sort((a, b) => a.margePct - b.margePct)
      .slice(0, 8),
  );

  readonly parVille = computed((): VilleAgg[] => {
    const map = new Map<string, { chantiers: number; portefeuilleHt: number; margeHt: number }>();
    for (const r of this.rows()) {
      const v = r.ville || '—';
      const cur = map.get(v) ?? { chantiers: 0, portefeuilleHt: 0, margeHt: 0 };
      cur.chantiers += 1;
      cur.portefeuilleHt += r.montantMarcheHt;
      cur.margeHt += r.margeProjeteeHt;
      map.set(v, cur);
    }
    return [...map.entries()]
      .map(([ville, agg]) => ({ ville, ...agg }))
      .sort((a, b) => b.portefeuilleHt - a.portefeuilleHt);
  });
}
