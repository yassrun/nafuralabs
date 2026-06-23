import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, PageHeaderComponent, PageShellComponent } from '@lib/anatomy/components';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { ExportService } from '@lib/anatomy/services/export.service';
import type { FactureMarche } from '../../marches/models';
import { FactureMarcheApiService } from '../../marches/factures/services/facture-marche-api.service';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

const COMPANY = {
  nom: 'Nafura BTP SARL', ice: '002345678901234',
  if_num: '87654321', rc: 'RC Casa 715869',
};

@Component({
  selector: 'app-simpl-is',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe, ButtonComponent],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig"></nf-page-header>

      <div class="controls">
        <label class="ctrl-label">{{ 'finance.declarations.simplIs.monthLabel' | translate }}
          <select [value]="mois()" (change)="mois.set($any($event.target).value)">
            @for (m of moisDispo; track m) { <option [value]="m">{{ m }}</option> }
          </select>
        </label>
        <nf-button variant="primary" class="btn-export" (clicked)="exportXml()">{{ 'finance.declarations.simplIs.exportXml' | translate }}</nf-button>
        <nf-button variant="primary" class="btn-xls" (clicked)="exportAnnexeXlsx()">{{ 'finance.declarations.simplIs.exportXlsx' | translate }}</nf-button>
      </div>

      <div class="decl-header">
        <div><strong>{{ 'finance.declarations.simplIs.headers.societe' | translate }} :</strong> {{ company.nom }}</div>
        <div><strong>{{ 'finance.declarations.simplIs.headers.if' | translate }} :</strong> {{ company.if_num }}</div>
        <div><strong>{{ 'finance.declarations.simplIs.headers.ice' | translate }} :</strong> {{ company.ice }}</div>
        <div><strong>{{ 'finance.declarations.simplIs.headers.periode' | translate }} :</strong> {{ mois() }}</div>
      </div>

      <section class="annexe">
        <h2 class="annexe-title">{{ 'finance.declarations.simplIs.annexA.title' | translate }}</h2>
        @if (ventesAnnexe().length > 0) {
          <table class="data-table">
            <thead><tr>
              <th>{{ 'finance.declarations.simplIs.annexA.cols.numero' | translate }}</th>
              <th>{{ 'finance.declarations.simplIs.annexA.cols.client' | translate }}</th>
              <th>{{ 'finance.declarations.simplIs.annexA.cols.iceClient' | translate }}</th>
              <th class="num">{{ 'finance.declarations.simplIs.annexA.cols.montantHt' | translate }}</th>
              <th>{{ 'finance.declarations.simplIs.annexA.cols.tauxTva' | translate }}</th>
              <th class="num">{{ 'finance.declarations.simplIs.annexA.cols.tvaCollectee' | translate }}</th>
              <th class="num">{{ 'finance.declarations.simplIs.annexA.cols.ttc' | translate }}</th>
            </tr></thead>
            <tbody>
              @for (v of ventesAnnexe(); track v.id) {
                <tr>
                  <td class="code">{{ v.numero }}</td>
                  <td>{{ v.client }}</td>
                  <td class="code">{{ v.ice ?? ('finance.common.dash' | translate) }}</td>
                  <td class="num">{{ v.ht | mad:2 }}</td>
                  <td class="center">{{ v.tvaTaux }}%</td>
                  <td class="num accent">{{ v.tva | mad:2 }}</td>
                  <td class="num">{{ v.ttc | mad:2 }}</td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3"><strong>{{ 'finance.common.labels.total' | translate }}</strong></td>
                <td class="num"><strong>{{ totVentes().ht | mad:2 }}</strong></td>
                <td></td>
                <td class="num accent"><strong>{{ totVentes().tva | mad:2 }}</strong></td>
                <td class="num"><strong>{{ totVentes().ttc | mad:2 }}</strong></td>
              </tr>
            </tfoot>
          </table>
        } @else {
          <p class="empty-section">{{ 'finance.declarations.simplIs.annexA.empty' | translate: { month: mois() } }}</p>
        }
      </section>

      <section class="resume-tva">
        <h2 class="annexe-title">{{ 'finance.declarations.simplIs.recap.title' | translate }}</h2>
        <div class="tva-rows">
          <div class="tva-row"><span>{{ 'finance.declarations.simplIs.recap.tvaCollectee' | translate }}</span><strong class="accent">{{ totVentes().tva | mad:2 }}</strong></div>
          <div class="tva-row"><span>{{ 'finance.declarations.simplIs.recap.tvaDeductible' | translate }}</span><strong class="deduction">— {{ tvaDeductible() | mad:2 }}</strong></div>
          <div class="tva-row tva-row--net"><span><strong>{{ 'finance.declarations.simplIs.recap.tvaNet' | translate }}</strong></span><strong class="net">{{ (totVentes().tva - tvaDeductible()) | mad:2 }}</strong></div>
        </div>
        <p class="note-tva">{{ 'finance.declarations.simplIs.note' | translate }}</p>
      </section>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .controls { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; }
    .ctrl-label { font-size: 13px; display: flex; align-items: center; gap: 8px; }
    .ctrl-label select { padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: white; }
    .btn-export { padding: 7px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; background: var(--nf-color-primary-700); color: white; }
    .btn-export:hover { background: var(--nf-color-primary-800); }
    .btn-xls { padding: 7px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; background: var(--nf-color-success-700); color: white; margin-left: 6px; }
    .btn-xls:hover { background: var(--nf-color-success-800); }
    .decl-header { display: flex; gap: 2rem; background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 8px; padding: 0.875rem 1.1rem; margin-bottom: 1.25rem; font-size: 13px; flex-wrap: wrap; }
    .annexe { margin-bottom: 1.5rem; }
    .annexe-title { font-size: 0.82rem; font-weight: 700; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 0.875rem; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; background: white; border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: hidden; margin-bottom: 0.5rem; }
    .data-table th { padding: 9px 12px; background: var(--nf-text-primary); color: white; font-weight: 600; text-align: left; white-space: nowrap; }
    .data-table th.num { text-align: right; }
    .data-table td { padding: 8px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    .data-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .data-table td.center { text-align: center; }
    .data-table td.code { font-family: monospace; font-size: 11px; color: var(--nf-color-text-secondary); }
    .total-row td { border-top: 2px solid var(--nf-color-text-primary); background: var(--nf-color-bg-subtle); padding: 8px 12px; }
    .total-row td.num { text-align: right; }
    .accent { color: var(--nf-color-primary-700); }
    .deduction { color: var(--nf-color-success-600); }
    .net { color: var(--nf-color-danger-600); font-size: 1.05rem; }
    .resume-tva { background: white; border: 1px solid var(--nf-color-border); border-radius: 0.875rem; padding: 1.1rem 1.25rem; }
    .tva-rows { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.875rem; }
    .tva-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; border-radius: 0.5rem; font-size: 13px; }
    .tva-row:nth-child(odd) { background: var(--nf-color-bg-subtle); }
    .tva-row--net { background: var(--nf-color-danger-50) !important; border: 1px solid var(--nf-color-danger-300); }
    .note-tva { font-size: 11px; color: var(--nf-color-text-muted); margin: 0; }
    .empty-section { color: var(--nf-color-text-muted); font-size: 13px; padding: 1rem 0; }
  `],
})
export class SimplIsPage implements OnInit {
  private readonly factureApi = inject(FactureMarcheApiService);
  private readonly exportSvc = inject(ExportService);
  private readonly audit = inject(ErpAuditService);
  private readonly translate = inject(TranslateService);
  readonly company = COMPANY;
  readonly moisDispo = ['2026-03', '2026-04', '2026-05'];
  readonly mois = signal('2026-05');
  private readonly facturesSig = signal<FactureMarche[]>([]);

  ngOnInit(): void {
    void this.factureApi.getAll().then(({ items }) => this.facturesSig.set(items)).catch(() => this.facturesSig.set([]));
  }

  readonly headerConfig = {
    title: this.translate.instant('finance.declarations.simplIs.title'),
    subtitle: this.translate.instant('finance.declarations.simplIs.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('finance.module.shortTitle'), route: '/finance' },
      { label: this.translate.instant('finance.declarations.entityName'), route: '/finance/declarations' },
      { label: this.translate.instant('finance.declarations.simplIs.crumb') },
    ],
  };

  readonly ventesAnnexe = computed(() =>
    this.facturesSig()
      .filter((f) => f.dateEmission.startsWith(this.mois()) && f.status !== 'BROUILLON')
      .map((f) => ({
        id: f.id,
        numero: f.numero,
        client: f.clientNom,
        ice: undefined as string | undefined,
        ht: f.netHt,
        tvaTaux: f.tvaTaux,
        tva: f.tvaMontant,
        ttc: f.netTtc,
      })),
  );

  readonly totVentes = computed(() => ({
    ht: this.ventesAnnexe().reduce((s, v) => s + v.ht, 0),
    tva: this.ventesAnnexe().reduce((s, v) => s + v.tva, 0),
    ttc: this.ventesAnnexe().reduce((s, v) => s + v.ttc, 0),
  }));

  // Estimation TVA déductible (25% de la TVA collectée — mock)
  readonly tvaDeductible = computed(() => Math.round(this.totVentes().tva * 0.25 * 100) / 100);

  exportAnnexeXlsx(): void {
    type Row = {
      id: string;
      numero: string;
      client: string | undefined;
      ice: string | undefined;
      ht: number;
      tvaTaux: number;
      tva: number;
      ttc: number;
    };
    const rows = this.ventesAnnexe() as Row[];
    const t = (k: string) => this.translate.instant(k);
    this.exportSvc.exportXlsx(rows, {
      filename: `SIMPL-IS_${this.mois()}`,
      sheetName: `TVA_${this.mois()}`,
      columns: [
        { header: t('finance.declarations.simplIs.annexA.cols.numero'), field: 'numero' },
        { header: t('finance.declarations.simplIs.annexA.cols.client'), field: 'client' },
        { header: t('finance.declarations.simplIs.headers.ice'), field: 'ice' },
        { header: t('finance.declarations.simplIs.xlsx.ht'), field: 'ht', type: 'currency' as const },
        { header: t('finance.declarations.simplIs.xlsx.tauxTva'), field: 'tvaTaux', type: 'number' as const },
        { header: t('finance.declarations.simplIs.xlsx.tva'), field: 'tva', type: 'currency' as const },
        { header: t('finance.declarations.simplIs.xlsx.ttc'), field: 'ttc', type: 'currency' as const },
      ],
    });
    this.audit.log(
      'EXPORT',
      'SIMPL_IS',
      this.mois(),
      this.company.if_num,
      this.translate.instant('finance.declarations.simplIs.audit.xlsx', { count: rows.length }),
    );
  }

  exportXml(): void {
    const t = this.totVentes();
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DeclarationTVA>
  <Contribuable>
    <IF>${this.company.if_num}</IF>
    <ICE>${this.company.ice}</ICE>
    <RaisonSociale>${this.company.nom}</RaisonSociale>
    <Periode>${this.mois()}</Periode>
  </Contribuable>
  <VentesImposables>
    <MontantHT>${t.ht.toFixed(2)}</MontantHT>
    <TVACollectee>${t.tva.toFixed(2)}</TVACollectee>
  </VentesImposables>
  <TVADeductible>${this.tvaDeductible().toFixed(2)}</TVADeductible>
  <TVANette>${(t.tva - this.tvaDeductible()).toFixed(2)}</TVANette>
</DeclarationTVA>`;
    const blob = new Blob([xml], { type: 'application/xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `TVA_SIMPL-IS_${this.company.if_num}_${this.mois()}.xml`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    this.audit.log(
      'EXPORT',
      'SIMPL_IS',
      this.mois(),
      this.company.if_num,
      this.translate.instant('finance.declarations.simplIs.audit.xml'),
    );
  }
}
