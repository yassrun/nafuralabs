import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {PageHeaderComponent, PageShellComponent, ButtonComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type { FichePaie } from '@applications/erp/rh/models';
import { PaieApiService } from '../services/paie-api.service';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

const COMPANY = {
  nom: 'Nafura BTP SARL',
  ice: '002345678901234',
  cnss: '1234567',
  ville: 'Casablanca',
};

@Component({
  selector: 'app-damancom',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe, ButtonComponent],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      <!-- Sélection mois -->
      <div class="controls">
        <label class="ctrl-label">{{ 'rh.paie.declarations.common.moisLabel' | translate }}
          <select [value]="mois()" (change)="mois.set($any($event.target).value)">
            @for (m of moisDisponibles; track m) { <option [value]="m">{{ m }}</option> }
          </select>
        </label>
        <nf-button variant="secondary" (clicked)="exportXml()">{{ 'rh.paie.declarations.damancom.exportXmlBtn' | translate }}</nf-button>
        <nf-button variant="secondary" (clicked)="exportCsv()">{{ 'rh.paie.declarations.damancom.exportCsvBtn' | translate }}</nf-button>
      </div>

      <!-- En-tête déclaration -->
      <div class="decl-header">
        <div><strong>{{ 'rh.paie.declarations.damancom.header.employeur' | translate }} :</strong> {{ company.nom }}</div>
        <div><strong>{{ 'rh.paie.declarations.damancom.header.cnss' | translate }} :</strong> {{ company.cnss }}</div>
        <div><strong>{{ 'rh.paie.declarations.damancom.header.periode' | translate }} :</strong> {{ mois() }}</div>
        <div><strong>{{ 'rh.paie.declarations.damancom.header.nbFiches' | translate }} :</strong> {{ fichesValides().length }}</div>
      </div>

      <!-- Tableau -->
      @if (fichesValides().length > 0) {
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>{{ 'rh.paie.declarations.damancom.columns.matricule' | translate }}</th>
              <th>{{ 'rh.paie.declarations.damancom.columns.nomEmploye' | translate }}</th>
              <th class="num">{{ 'rh.paie.declarations.damancom.columns.salaireBrut' | translate }}</th>
              <th class="num">{{ 'rh.paie.declarations.damancom.columns.baseCnss' | translate }}</th>
              <th class="num">{{ 'rh.paie.declarations.damancom.columns.cotCnssSal' | translate }}</th>
              <th class="num">{{ 'rh.paie.declarations.damancom.columns.cotAmoSal' | translate }}</th>
              <th class="num">{{ 'rh.paie.declarations.damancom.columns.totalSal' | translate }}</th>
              <th class="num">{{ 'rh.paie.declarations.damancom.columns.cotPatronale' | translate }}</th>
              <th class="num">{{ 'rh.paie.declarations.damancom.columns.igrRetenu' | translate }}</th>
              <th class="num">{{ 'rh.paie.declarations.damancom.columns.netPaye' | translate }}</th>
            </tr></thead>
            <tbody>
              @for (f of fichesValides(); track f.id) {
                <tr>
                  <td class="code">{{ f.employeId }}</td>
                  <td>{{ f.employeNom }}</td>
                  <td class="num">{{ f.salaireBrut | mad:2 }}</td>
                  <td class="num">{{ baseCnss(f.salaireBrut) | mad:2 }}</td>
                  <td class="num">{{ f.cotisationCNSS | mad:2 }}</td>
                  <td class="num">{{ f.cotisationAMO | mad:2 }}</td>
                  <td class="num">{{ f.totalRetenues | mad:2 }}</td>
                  <td class="num">{{ cotisationPatronale(f.salaireBrut) | mad:2 }}</td>
                  <td class="num">{{ f.igr | mad:2 }}</td>
                  <td class="num">{{ f.salaireNetAPayer | mad:2 }}</td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="2"><strong>{{ 'rh.paie.declarations.common.totaux' | translate }}</strong></td>
                <td class="num"><strong>{{ totaux().brut | mad:2 }}</strong></td>
                <td class="num"></td>
                <td class="num"><strong>{{ totaux().cnss | mad:2 }}</strong></td>
                <td class="num"><strong>{{ totaux().amo | mad:2 }}</strong></td>
                <td class="num"><strong>{{ totaux().retenues | mad:2 }}</strong></td>
                <td class="num"><strong>{{ totaux().patronale | mad:2 }}</strong></td>
                <td class="num"><strong>{{ totaux().igr | mad:2 }}</strong></td>
                <td class="num"><strong>{{ totaux().net | mad:2 }}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Récapitulatif à verser -->
        <div class="recap-versement">
          <h3>{{ 'rh.paie.declarations.damancom.recap.title' | translate }}</h3>
          <div class="versements">
            <div class="versement">
              <span>{{ 'rh.paie.declarations.damancom.recap.cnssSal' | translate }}</span>
              <strong>{{ totaux().cnss | mad:2 }}</strong>
            </div>
            <div class="versement">
              <span>{{ 'rh.paie.declarations.damancom.recap.amoSal' | translate }}</span>
              <strong>{{ totaux().amo | mad:2 }}</strong>
            </div>
            <div class="versement">
              <span>{{ 'rh.paie.declarations.damancom.recap.patronale' | translate }}</span>
              <strong>{{ totaux().patronale | mad:2 }}</strong>
            </div>
            <div class="versement versement--total">
              <span><strong>{{ 'rh.paie.declarations.damancom.recap.totalCnss' | translate }}</strong></span>
              <strong class="total-montant">{{ (totaux().cnss + totaux().amo + totaux().patronale) | mad:2 }}</strong>
            </div>
            <div class="versement">
              <span>{{ 'rh.paie.declarations.damancom.recap.igrDgi' | translate }}</span>
              <strong>{{ totaux().igr | mad:2 }}</strong>
            </div>
          </div>
        </div>

      } @else {
        <div class="empty">{{ 'rh.paie.declarations.damancom.empty' | translate: { mois: mois() } }}</div>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .controls { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; }
    .ctrl-label { font-size: 13px; display: flex; align-items: center; gap: 8px; }
    .ctrl-label select { padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: var(--nf-color-surface); }
    .btn-export { padding: 7px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
    .btn-export { background: var(--nf-color-primary-700); color: var(--nf-color-primary-contrast); }
    .btn-export:hover { background: var(--nf-color-primary-700); }
    .btn-export--csv { background: var(--nf-color-primary-500); }
    .btn-export--csv:hover { background: var(--nf-color-primary-600); }
    .decl-header { display: flex; gap: 2rem; background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 8px; padding: 0.875rem 1.1rem; margin-bottom: 1rem; font-size: 13px; flex-wrap: wrap; }
    .table-wrap { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; margin-bottom: 1.25rem; }
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    th { position: sticky; top: 0; padding: 9px 10px; background: var(--nf-color-text-primary); color: var(--nf-color-primary-contrast); font-weight: 600; text-align: left; white-space: nowrap; z-index: 1; }
    th.num { text-align: right; }
    td { padding: 8px 10px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.code { font-family: monospace; font-size: 11px; color: var(--nf-color-text-secondary); }
    .total-row td { border-top: 2px solid var(--nf-color-text-primary); background: var(--nf-color-bg-subtle); font-size: 12.5px; padding: 8px 10px; }
    .total-row td.num { text-align: right; }
    .recap-versement { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.875rem; padding: 1.1rem 1.25rem; }
    .recap-versement h3 { margin: 0 0 0.875rem; font-size: 0.85rem; font-weight: 700; color: var(--nf-color-text-primary); text-transform: uppercase; letter-spacing: 0.05em; }
    .versements { display: flex; flex-direction: column; gap: 0.4rem; }
    .versement { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; border-radius: 0.5rem; font-size: 13px; }
    .versement:nth-child(odd) { background: var(--nf-color-bg-subtle); }
    .versement--total { background: var(--nf-color-primary-50) !important; border: 1px solid var(--nf-color-primary-200); margin-top: 0.4rem; }
    .total-montant { font-size: 1.1rem; color: var(--nf-color-primary-700); }
    .empty { text-align: center; padding: 3rem; color: var(--nf-color-text-muted); font-size: 0.9rem; }
  `],
})
export class DamancomPage {
  private readonly paieApi = inject(PaieApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly translate = inject(TranslateService);

  readonly company = COMPANY;
  readonly moisDisponibles = ['2026-03', '2026-04', '2026-05'];
  readonly mois = signal('2026-05');
  readonly paieRows = signal<FichePaie[]>([]);

  constructor() {
    void this.refreshPaie();
  }

  private async refreshPaie(): Promise<void> {
    try {
      const { items } = await this.paieApi.getAll({ page: 1, pageSize: 500 });
      this.paieRows.set(items);
    } catch {
      this.paieRows.set([]);
    }
  }

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('rh.paie.declarations.damancom.title'),
    subtitle: this.translate.instant('rh.paie.declarations.damancom.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('rh.common.module'), route: '/rh' },
      { label: this.translate.instant('rh.routes.paie.title'), route: '/rh/paie' },
      { label: this.translate.instant('rh.routes.damancom.breadcrumb') },
    ],
  }));

  readonly fichesValides = computed(() =>
    this.paieRows().filter(
      p => p.mois === this.mois() && (p.status === 'VALIDEE' || p.status === 'PAYEE'),
    ),
  );

  readonly totaux = computed(() => {
    const fiches = this.fichesValides();
    return {
      brut: fiches.reduce((s, f) => s + f.salaireBrut, 0),
      cnss: fiches.reduce((s, f) => s + f.cotisationCNSS, 0),
      amo: fiches.reduce((s, f) => s + f.cotisationAMO, 0),
      retenues: fiches.reduce((s, f) => s + f.totalRetenues, 0),
      patronale: fiches.reduce((s, f) => s + this.cotisationPatronale(f.salaireBrut), 0),
      igr: fiches.reduce((s, f) => s + f.igr, 0),
      net: fiches.reduce((s, f) => s + f.salaireNetAPayer, 0),
    };
  });

  baseCnss(brut: number): number { return Math.min(brut, 6000); }
  cotisationPatronale(brut: number): number {
    return Math.round((Math.min(brut, 6000) * 0.1043 + brut * 0.0411) * 100) / 100;
  }

  exportXml(): void {
    const fiches = this.fichesValides();
    const t = this.totaux();
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DAMANCOM xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Employeur>
    <NumeroAffiliation>${this.company.cnss}</NumeroAffiliation>
    <RaisonSociale>${this.company.nom}</RaisonSociale>
    <Periode>${this.mois()}</Periode>
  </Employeur>
  <Salaries>
${fiches.map(f => `    <Salarie>
      <Matricule>${f.employeId}</Matricule>
      <NomPrenom>${f.employeNom}</NomPrenom>
      <SalaireBrut>${f.salaireBrut.toFixed(2)}</SalaireBrut>
      <CotisationSalarialeCNSS>${f.cotisationCNSS.toFixed(2)}</CotisationSalarialeCNSS>
      <CotisationSalarialeAMO>${f.cotisationAMO.toFixed(2)}</CotisationSalarialeAMO>
      <IGR>${f.igr.toFixed(2)}</IGR>
      <SalaireNet>${f.salaireNetAPayer.toFixed(2)}</SalaireNet>
    </Salarie>`).join('\n')}
  </Salaries>
  <Totaux>
    <TotalBrut>${t.brut.toFixed(2)}</TotalBrut>
    <TotalCNSS>${(t.cnss + t.amo + t.patronale).toFixed(2)}</TotalCNSS>
    <TotalIGR>${t.igr.toFixed(2)}</TotalIGR>
  </Totaux>
</DAMANCOM>`;
    const blob = new Blob([xml], { type: 'application/xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `DAMANCOM_${this.company.cnss}_${this.mois()}.xml`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    this.audit.log(
      'EXPORT',
      'DAMANCOM',
      this.mois(),
      `DAMANCOM ${this.mois()}`,
      `XML — ${this.fichesValides().length} salariés`,
    );
  }

  exportCsv(): void {
    const fiches = this.fichesValides();
    const rows = [
      'Matricule;Nom;Salaire Brut;CNSS sal.;AMO sal.;IGR;Net payé',
      ...fiches.map(f => `${f.employeId};${f.employeNom};${f.salaireBrut};${f.cotisationCNSS};${f.cotisationAMO};${f.igr};${f.salaireNetAPayer}`),
    ].join('\r\n');
    const blob = new Blob(['\ufeff' + rows], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `DAMANCOM_${this.mois()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    this.audit.log(
      'EXPORT',
      'DAMANCOM',
      this.mois(),
      `DAMANCOM ${this.mois()}`,
      `CSV — ${fiches.length} salariés`,
    );
  }
}
