import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { CashFlowProjectionService, DEFAULT_CASHFLOW_SEUIL_ALERTE_MAD } from '../services/cash-flow-projection.service';

@Component({
  selector: 'app-cash-flow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      <!-- KPIs -->
      <div class="kpi-strip">
        <article class="kpi">
          <span>{{ 'dashboard.cashFlow.kpis.soldeProjete' | translate }}</span>
          <strong [class.negative]="cashflow().at(-1)!.soldeCumule < 0">{{ cashflow().at(-1)!.soldeCumule | mad }}</strong>
        </article>
        <article class="kpi">
          <span>{{ 'dashboard.cashFlow.kpis.seuilAlerte' | translate }}</span>
          <strong>{{ seuil | mad }}</strong>
        </article>
        <article class="kpi">
          <span>{{ 'dashboard.cashFlow.kpis.moisSousSeuil' | translate }}</span>
          <strong [class.danger]="alertes() > 0">{{ alertes() }}</strong>
        </article>
      </div>

      <!-- Bar chart (CSS-only) -->
      <div class="chart-wrapper">
        <div class="chart">
          @for (m of cashflow(); track m.mois) {
            <div class="bar-group" [class.bar-group--alert]="m.alerte" [title]="barTooltip(m)">
              <div class="bars">
                <div class="bar bar--enc" [style.height.%]="barPct(m.encaissementsPrevus)"></div>
                <div class="bar bar--dec" [style.height.%]="barPct(m.decaissementsPrevus)"></div>
              </div>
              <span class="bar-label">{{ m.label.slice(0, 3) }}</span>
            </div>
          }
        </div>
        <div class="legend-chart">
          <span class="dot enc"></span> {{ 'dashboard.cashFlow.legend.encaissements' | translate }}
          <span class="dot dec dot--spaced"></span> {{ 'dashboard.cashFlow.legend.decaissements' | translate }}
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>{{ 'dashboard.cashFlow.columns.mois' | translate }}</th>
            <th class="num">{{ 'dashboard.cashFlow.columns.encaissementsPrevus' | translate }}</th>
            <th class="num">{{ 'dashboard.cashFlow.columns.decaissementsPrevus' | translate }}</th>
            <th class="num">{{ 'dashboard.cashFlow.columns.soldeMensuel' | translate }}</th>
            <th class="num">{{ 'dashboard.cashFlow.columns.soldeCumule' | translate }}</th>
            <th>{{ 'dashboard.cashFlow.columns.alerte' | translate }}</th>
          </tr></thead>
          <tbody>
            @for (m of cashflow(); track m.mois) {
              <tr [class.row--alert]="m.alerte"
                  [attr.title]="detailTooltip(m)">
                <td>{{ m.label }}</td>
                <td class="num success-text">{{ m.encaissementsPrevus | mad }}</td>
                <td class="num danger-text">{{ m.decaissementsPrevus | mad }}</td>
                <td class="num" [class.positive]="m.soldeMensuel >= 0" [class.negative]="m.soldeMensuel < 0">
                  {{ m.soldeMensuel >= 0 ? '+' : '' }}{{ m.soldeMensuel | mad }}
                </td>
                <td class="num" [class.positive]="m.soldeCumule >= SEUIL" [class.negative]="m.soldeCumule < 0">
                  {{ m.soldeCumule | mad }}
                </td>
                <td>
                  @if (m.alerte) { <span class="alerte-badge">{{ 'dashboard.cashFlow.alerteBadge' | translate }}</span> }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .kpi-strip { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .kpi { padding: 0.75rem 1rem; background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; min-width: 160px; }
    .kpi span { display: block; font-size: 0.7rem; color: var(--nf-color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.15rem; }
    .kpi strong { font-size: 0.95rem; font-weight: 700; color: var(--nf-color-text-primary); }
    .kpi strong.negative { color: var(--nf-color-danger-600); }
    .kpi strong.danger { color: var(--nf-color-danger-600); }

    .chart-wrapper { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.875rem; padding: 1.25rem; margin-bottom: 1.25rem; }
    .chart { display: flex; align-items: flex-end; gap: 12px; height: 160px; padding-bottom: 28px; position: relative; }
    .bar-group { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
    .bar-group--alert .bars { background: var(--nf-color-warning-50); border-radius: 4px; }
    .bars { display: flex; align-items: flex-end; gap: 3px; height: 140px; }
    .bar { width: 16px; border-radius: 3px 3px 0 0; min-height: 2px; transition: height 0.3s; }
    .bar--enc { background: var(--nf-color-primary-500); }
    .bar--dec { background: var(--nf-color-danger-400); }
    .bar-label { font-size: 10px; color: var(--nf-color-text-muted); white-space: nowrap; }
    .legend-chart { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--nf-color-text-secondary); margin-top: 8px; }
    .dot { display: inline-block; width: 10px; height: 10px; border-radius: 2px; }
    .dot.enc { background: var(--nf-color-primary-500); }
    .dot.dec { background: var(--nf-color-danger-400); }
    .dot--spaced { margin-left: var(--nf-space-3, 12px); }

    .table-wrap { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { padding: 10px 12px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); white-space: nowrap; }
    th.num { text-align: right; }
    td { padding: 9px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .row--alert { background: var(--nf-color-warning-50); }
    .success-text { color: var(--nf-color-success-700); }
    .danger-text { color: var(--nf-color-danger-700); }
    .positive { color: var(--nf-color-success-700); }
    .negative { color: var(--nf-color-danger-600); }
    .alerte-badge { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
  `],
})
export class CashFlowPage {
  private readonly projectionSvc = inject(CashFlowProjectionService);
  private readonly translate = inject(TranslateService);

  readonly seuil = DEFAULT_CASHFLOW_SEUIL_ALERTE_MAD;
  readonly SEUIL = DEFAULT_CASHFLOW_SEUIL_ALERTE_MAD;

  readonly cashflow = this.projectionSvc.months;

  readonly alertes = computed(() => this.cashflow().filter((m) => m.alerte).length);

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('dashboard.cashFlow.title'),
    subtitle: this.translate.instant('dashboard.cashFlow.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('dashboard.pilotage.breadcrumb') },
      { label: this.translate.instant('dashboard.cashFlow.breadcrumb') },
    ],
  }));

  private get maxBar(): number {
    return Math.max(...this.cashflow().map((m) => Math.max(m.encaissementsPrevus, m.decaissementsPrevus)), 1);
  }

  barPct(v: number): number {
    return Math.round((v / this.maxBar) * 100);
  }

  fmtMad(n: number): string {
    const locale = resolveLocale(this.translate);
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);
  }

  barTooltip(m: { label: string; encaissementsPrevus: number; decaissementsPrevus: number; soldeMensuel: number }): string {
    const t = (key: string) => this.translate.instant(key);
    return (
      `${m.label}\n` +
      `${t('dashboard.cashFlow.tooltip.encaissements')}: ${this.fmtMad(m.encaissementsPrevus)}\n` +
      `${t('dashboard.cashFlow.tooltip.decaissements')}: ${this.fmtMad(m.decaissementsPrevus)}\n` +
      `${t('dashboard.cashFlow.tooltip.solde')}: ${this.fmtMad(m.soldeMensuel)}`
    );
  }

  detailTooltip(m: { detail: {
    encaissementsSituations: number;
    encaissementsChantiersActifs: number;
    decaissementsFacturesFournisseur: number;
    decaissementsMasseSalariale: number;
    decaissementsChargesSociales: number;
    decaissementsTraites: number;
  } }): string {
    const d = m.detail;
    const t = (key: string) => this.translate.instant(key);
    return [
      `${t('dashboard.cashFlow.tooltip.situations')}: ${this.fmtMad(d.encaissementsSituations)}`,
      `${t('dashboard.cashFlow.tooltip.tresoChantiers')}: ${this.fmtMad(d.encaissementsChantiersActifs)}`,
      `${t('dashboard.cashFlow.tooltip.ff')}: ${this.fmtMad(d.decaissementsFacturesFournisseur)}`,
      `${t('dashboard.cashFlow.tooltip.paie')}: ${this.fmtMad(d.decaissementsMasseSalariale)}`,
      `${t('dashboard.cashFlow.tooltip.chargesSoc')}: ${this.fmtMad(d.decaissementsChargesSociales)}`,
      `${t('dashboard.cashFlow.tooltip.traites')}: ${this.fmtMad(d.decaissementsTraites)}`,
    ].join('\n');
  }
}
