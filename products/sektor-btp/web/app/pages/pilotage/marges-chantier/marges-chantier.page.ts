import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FilterResetComponent } from '@lib/anatomy/components/molecules/filter-reset/filter-reset.component';
import { ExportService, type ExportColumn } from '@lib/anatomy/services/export.service';

import {PageHeaderComponent, PageShellComponent, ButtonComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import {
  margePilotageCssClass,
  PilotageChantierMargesService,
  type PilotageChantierMargeRow,
} from '../services/pilotage-chantier-marges.service';
import { CHANTIER_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import { ErpAuditService } from '../../../shell/erp-audit.service';

@Component({
  selector: 'app-marges-chantier',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslateModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe, FilterResetComponent, ButtonComponent],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      <!-- KPI global strip -->
      <div class="kpi-strip">
        <article class="kpi">
          <span>{{ 'dashboard.margesChantier.kpis.chantiersActifs' | translate }}</span>
          <strong>{{ stats().actifs }}</strong>
        </article>
        <article class="kpi">
          <span>{{ 'dashboard.margesChantier.kpis.portefeuille' | translate }}</span>
          <strong>{{ stats().portefeuille | mad }}</strong>
        </article>
        <article class="kpi">
          <span>{{ 'dashboard.margesChantier.kpis.margeGlobale' | translate }}</span>
          <strong [class]="margeCss(stats().margePct)">{{ stats().margePct | number:'1.1-1' }}%</strong>
        </article>
        <article class="kpi">
          <span>{{ 'dashboard.margesChantier.kpis.margeHt' | translate }}</span>
          <strong>{{ stats().margeHt | mad }}</strong>
        </article>
        <article class="kpi">
          <span>{{ 'dashboard.margesChantier.kpis.alertesMargeBasse' | translate }}</span>
          <strong [class.danger]="stats().alertesMarge > 0">{{ stats().alertesMarge }}</strong>
        </article>
        <article class="kpi">
          <span>{{ 'dashboard.margesChantier.kpis.alertesFacturationAvancement' | translate }}</span>
          <strong [class.warning]="stats().alertesDiff > 0">{{ stats().alertesDiff }}</strong>
        </article>
      </div>

      <!-- Filters -->
      <div class="filters">
        <input class="search" type="search" [placeholder]="'dashboard.margesChantier.filters.searchPlaceholder' | translate"
          [value]="search()" (input)="search.set($any($event.target).value)" />
        <select [value]="filterStatus()" (change)="filterStatus.set($any($event.target).value)">
          <option value="">{{ 'dashboard.margesChantier.filters.allStatuses' | translate }}</option>
          <option value="EN_COURS">{{ chantierStatusKeys.EN_COURS | translate }}</option>
          <option value="SUSPENDU">{{ chantierStatusKeys.SUSPENDU | translate }}</option>
          <option value="TERMINE">{{ chantierStatusKeys.TERMINE | translate }}</option>
        </select>
        <select [value]="sortBy()" (change)="sortBy.set($any($event.target).value)">
          <option value="margePct">{{ 'dashboard.margesChantier.filters.sortBy.marge' | translate }}</option>
          <option value="avancementPercent">{{ 'dashboard.margesChantier.filters.sortBy.avancement' | translate }}</option>
          <option value="montantMarcheHt">{{ 'dashboard.margesChantier.filters.sortBy.montant' | translate }}</option>
          <option value="chantierCode">{{ 'dashboard.margesChantier.filters.sortBy.code' | translate }}</option>
        </select>
        <nf-button variant="secondary" (clicked)="exportCsv()">{{ 'dashboard.margesChantier.actions.exportCsv' | translate }}</nf-button>
        <span class="count">{{ 'dashboard.margesChantier.count' | translate: { count: rows().length } }}</span>
        <nf-filter-reset [active]="hasFilter()" (reset)="resetFilters()"></nf-filter-reset>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ 'dashboard.margesChantier.columns.chantier' | translate }}</th>
              <th>{{ 'dashboard.margesChantier.columns.ville' | translate }}</th>
              <th class="num">{{ 'dashboard.margesChantier.columns.marcheHt' | translate }}</th>
              <th class="num">{{ 'dashboard.margesChantier.columns.factureHt' | translate }}</th>
              <th class="center">{{ 'dashboard.margesChantier.columns.pctFacture' | translate }}</th>
              <th class="center">{{ 'dashboard.margesChantier.columns.avancement' | translate }}</th>
              <th class="center">{{ 'dashboard.margesChantier.columns.diffFactAv' | translate }}</th>
              <th class="num">{{ 'dashboard.margesChantier.columns.encaisseHt' | translate }}</th>
              <th class="num">{{ 'dashboard.margesChantier.columns.margeProjetee' | translate }}</th>
              <th class="center">{{ 'dashboard.margesChantier.columns.margePct' | translate }}</th>
              <th>{{ 'dashboard.margesChantier.columns.statut' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.chantierId) {
              <tr [routerLink]="['/chantiers', r.chantierId]" class="clickable"
                  [class.row--alerte-marge]="r.alerteMarge"
                  [class.row--alerte-diff]="r.alerteDiff && !r.alerteMarge">
                <td>
                  <div class="chantier-cell">
                    <strong class="code">{{ r.chantierCode }}</strong>
                    <span class="nom">{{ r.chantierNom }}</span>
                  </div>
                </td>
                <td class="ville">{{ r.ville }}</td>
                <td class="num">{{ r.montantMarcheHt | mad }}</td>
                <td class="num">{{ r.cumulFactureHt | mad }}</td>
                <td class="center">
                  <div class="mini-progress">
                    <div class="bar"><div class="fill fill--facture" [style.width.%]="r.pctFacture"></div></div>
                    <span>{{ r.pctFacture | number:'1.0-0' }}%</span>
                  </div>
                </td>
                <td class="center">
                  <div class="mini-progress">
                    <div class="bar"><div class="fill" [style.width.%]="r.avancementPercent"></div></div>
                    <span>{{ r.avancementPercent }}%</span>
                  </div>
                </td>
                <td class="center" [class.diff-warn]="r.alerteDiff">
                  {{ 'dashboard.margesChantier.diffPts' | translate: { value: (r.diffFactureAvancement > 0 ? '+' : '') + (r.diffFactureAvancement | number:'1.0-0') } }}
                </td>
                <td class="num">{{ r.cumulEncaisseHt | mad }}</td>
                <td class="num" [class.positive]="r.margeProjeteeHt > 0" [class.negative]="r.margeProjeteeHt < 0">
                  {{ r.margeProjeteeHt | mad }}
                </td>
                <td class="center">
                  <span class="marge-badge {{ margeCss(r.margePct) }}">
                    {{ r.margePct | number:'1.1-1' }}%
                  </span>
                </td>
                <td>
                  <span class="status-dot status-dot--{{ r.status.toLowerCase() }}"></span>
                  {{ statusKey(r.status) | translate }}
                </td>
              </tr>
            } @empty {
              <tr><td colspan="11" class="empty">{{ 'dashboard.margesChantier.empty' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>

      <p class="legend">{{ 'dashboard.margesChantier.legend' | translate }}</p>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .kpi-strip { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .kpi { padding: 0.75rem 1rem; background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; min-width: 140px; }
    .kpi span { display: block; font-size: 0.7rem; color: var(--nf-color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.15rem; }
    .kpi strong { font-size: 0.95rem; font-weight: 700; color: var(--nf-color-text-primary); }
    .kpi strong.danger { color: var(--nf-color-danger-600); }
    .kpi strong.warning { color: var(--nf-color-warning-600); }

    .filters { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
    .search { flex: 1; min-width: 160px; max-width: 280px; padding: 7px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; }
    .filters select { padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: var(--nf-color-surface); }
    .btn-export { padding: 7px 12px; border: 1px solid var(--nf-color-primary-500); border-radius: 6px; font-size: 13px; font-weight: 600; color: var(--nf-color-primary-600); background: var(--nf-color-success-50); cursor: pointer; }
    .btn-export:hover { background: var(--nf-color-primary-100); }
    .count { font-size: 13px; color: var(--nf-color-text-secondary); }

    .table-wrap { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; max-height: calc(100vh - 420px); }
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    th { position: sticky; top: 0; padding: 9px 10px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); white-space: nowrap; z-index: 1; }
    th.num { text-align: right; }
    th.center { text-align: center; }
    td { padding: 8px 10px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); vertical-align: middle; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.center { text-align: center; }
    td.ville { white-space: nowrap; color: var(--nf-color-text-secondary); }
    .clickable { cursor: pointer; transition: background 80ms; }
    .clickable:hover { background: var(--nf-color-bg-subtle); }
    .row--alerte-marge { background: var(--nf-color-danger-50); border-left: 3px solid var(--nf-color-danger-600); }
    .row--alerte-diff { background: var(--nf-color-warning-50); border-left: 3px solid var(--nf-color-warning-500); }

    .chantier-cell { display: flex; flex-direction: column; }
    .code { color: var(--nf-color-primary-700); font-size: 12px; }
    .nom { color: var(--nf-color-text-secondary); font-size: 11px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .mini-progress { display: flex; align-items: center; gap: 5px; justify-content: center; font-size: 11px; color: var(--nf-color-text-secondary); }
    .bar { width: 44px; height: 5px; background: var(--nf-color-border); border-radius: 3px; overflow: hidden; }
    .fill { height: 100%; background: var(--nf-color-primary-500); border-radius: 3px; }
    .fill--facture { background: var(--nf-color-primary-500); }

    .diff-warn { color: var(--nf-color-warning-700); font-weight: 700; }

    .marge-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; }
    .marge--ok { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .marge--warning { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .marge--danger { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }

    .positive { color: var(--nf-color-success-700); }
    .negative { color: var(--nf-color-danger-700); }

    .status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 4px; }
    .status-dot--en_cours { background: var(--nf-color-primary-500); }
    .status-dot--suspendu { background: var(--nf-color-warning-500); }
    .status-dot--termine { background: var(--nf-color-primary-500); }

    .legend { font-size: 11px; color: var(--nf-color-text-muted); margin-top: 0.75rem; }
    .empty { text-align: center; padding: 2rem; color: var(--nf-color-text-muted); }
  `],
})
export class MargesChantierPage {
  private readonly pilotageMarges = inject(PilotageChantierMargesService);
  private readonly exportService = inject(ExportService);
  private readonly audit = inject(ErpAuditService);
  private readonly translate = inject(TranslateService);

  readonly search = signal('');
  readonly filterStatus = signal('');
  readonly sortBy = signal<keyof PilotageChantierMargeRow>('margePct');

  readonly chantierStatusKeys = CHANTIER_STATUS_KEYS;

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('dashboard.margesChantier.title'),
    subtitle: this.translate.instant('dashboard.margesChantier.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('dashboard.pilotage.breadcrumb') },
      { label: this.translate.instant('dashboard.margesChantier.breadcrumb') },
    ],
  }));

  statusKey(status: string): string {
    return CHANTIER_STATUS_KEYS[status as keyof typeof CHANTIER_STATUS_KEYS] ?? status;
  }

  private readonly allRows = this.pilotageMarges.rows;

  readonly rows = computed(() => {
    const q = this.search().toLowerCase().trim();
    const st = this.filterStatus();
    const sort = this.sortBy();
    let list = this.allRows();
    if (q) {
      list = list.filter(
        (r) =>
          r.chantierCode.toLowerCase().includes(q) ||
          r.chantierNom.toLowerCase().includes(q) ||
          r.ville.toLowerCase().includes(q),
      );
    }
    if (st) list = list.filter((r) => r.status === st);
    return [...list].sort((a, b) => {
      if (sort === 'chantierCode') return a.chantierCode.localeCompare(b.chantierCode);
      return (b[sort] as number) - (a[sort] as number);
    });
  });

  readonly stats = computed(() => {
    const all = this.allRows();
    const actifs = all.filter((r) => r.status === 'EN_COURS').length;
    const portefeuille = all.reduce((s, r) => s + r.montantMarcheHt, 0);
    const margeHt = all.reduce((s, r) => s + r.margeProjeteeHt, 0);
    const margePct = portefeuille > 0 ? Math.round((margeHt / portefeuille) * 1000) / 10 : 0;
    const alertesMarge = all.filter((r) => r.alerteMarge).length;
    const alertesDiff = all.filter((r) => r.alerteDiff).length;
    return { actifs, portefeuille, margePct, margeHt, alertesMarge, alertesDiff };
  });

  margeCss = margePilotageCssClass;
  readonly hasFilter = computed(() => !!this.search().trim() || !!this.filterStatus());

  resetFilters(): void {
    this.search.set('');
    this.filterStatus.set('');
  }

  private get exportColumns(): ExportColumn<PilotageChantierMargeRow>[] {
    const t = (key: string) => this.translate.instant(key);
    return [
      { header: t('dashboard.margesChantier.export.headers.code'), field: 'chantierCode' },
      { header: t('dashboard.margesChantier.export.headers.nom'), field: 'chantierNom' },
      { header: t('dashboard.margesChantier.export.headers.ville'), field: 'ville' },
      { header: t('dashboard.margesChantier.export.headers.statut'), field: 'status' },
      { header: t('dashboard.margesChantier.export.headers.marcheHt'), field: 'montantMarcheHt', type: 'currency' },
      { header: t('dashboard.margesChantier.export.headers.factureHt'), field: 'cumulFactureHt', type: 'currency' },
      { header: t('dashboard.margesChantier.export.headers.pctFacture'), field: 'pctFacture', type: 'percent' },
      { header: t('dashboard.margesChantier.export.headers.avancement'), field: 'avancementPercent', type: 'number' },
      { header: t('dashboard.margesChantier.export.headers.diffFactAv'), field: 'diffFactureAvancement', type: 'number' },
      { header: t('dashboard.margesChantier.export.headers.encaisseHt'), field: 'cumulEncaisseHt', type: 'currency' },
      { header: t('dashboard.margesChantier.export.headers.margeProjetee'), field: 'margeProjeteeHt', type: 'currency' },
      { header: t('dashboard.margesChantier.export.headers.margePct'), field: 'margePct', type: 'percent' },
    ];
  }

  exportCsv(): void {
    const data = this.rows();
    this.exportService.exportCsv(data, {
      filename: this.translate.instant('dashboard.margesChantier.export.filename'),
      columns: this.exportColumns,
    });
    this.audit.log(
      'EXPORT',
      'PILOTAGE',
      'marges-chantier',
      this.translate.instant('dashboard.margesChantier.export.auditLabel'),
      this.translate.instant('dashboard.margesChantier.export.auditDetail', { count: data.length }),
    );
  }
}
