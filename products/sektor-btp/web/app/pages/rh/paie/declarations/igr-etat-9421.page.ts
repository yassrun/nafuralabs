import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {PageHeaderComponent, PageShellComponent, ButtonComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type { FichePaie } from '@applications/erp/rh/models';
import { PaieApiService } from '../services/paie-api.service';

const COMPANY = {
  nom: 'Nafura BTP SARL', ice: '002345678901234',
  if_num: '87654321', rc: 'RC Casa 715869', cnss: '1234567',
};

@Component({
  selector: 'app-igr-etat-9421',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe, ButtonComponent],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      <div class="controls">
        <label class="ctrl-label">{{ 'rh.paie.declarations.common.exerciseLabel' | translate }}
          <select [value]="annee()" (change)="annee.set(+$any($event.target).value)">
            <option [value]="2025">2025</option>
            <option [value]="2026">2026</option>
          </select>
        </label>
        <nf-button variant="secondary" (clicked)="exportXml()">{{ 'rh.paie.declarations.etat9421.exportXmlBtn' | translate }}</nf-button>
        <nf-button variant="secondary" (clicked)="print()">{{ 'rh.paie.declarations.etat9421.imprimerBtn' | translate }}</nf-button>
      </div>

      <!-- En-tête DGI -->
      <div class="dgi-header">
        <div class="dgi-logo">
          <strong>{{ 'rh.paie.declarations.common.royaumeMaroc' | translate }}</strong>
          <p>{{ 'rh.paie.declarations.common.dgi' | translate }}</p>
          <p>{{ 'rh.paie.declarations.etat9421.header.titre' | translate }}</p>
          <p class="etat-num">{{ 'rh.paie.declarations.etat9421.header.etatExercice' | translate: { annee: annee() } }}</p>
        </div>
        <div class="employer-ids">
          <table class="ids-table">
            <tr><td>{{ 'rh.paie.declarations.common.employeur' | translate }}</td><td>{{ company.nom }}</td></tr>
            <tr><td>{{ 'rh.paie.declarations.common.if' | translate }}</td><td>{{ company.if_num }}</td></tr>
            <tr><td>{{ 'rh.paie.declarations.common.ice' | translate }}</td><td>{{ company.ice }}</td></tr>
            <tr><td>{{ 'rh.paie.declarations.common.cnss' | translate }}</td><td>{{ company.cnss }}</td></tr>
          </table>
        </div>
      </div>

      <!-- Tableau 9421 -->
      @if (lignes().length > 0) {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th rowspan="2">{{ 'rh.paie.declarations.etat9421.columns.cin' | translate }}</th>
                <th rowspan="2">{{ 'rh.paie.declarations.etat9421.columns.nomPrenom' | translate }}</th>
                <th class="num" colspan="3">{{ 'rh.paie.declarations.etat9421.columns.remunerationsBrutes' | translate }}</th>
                <th class="num" colspan="3">{{ 'rh.paie.declarations.etat9421.columns.deductions' | translate }}</th>
                <th class="num" rowspan="2">{{ 'rh.paie.declarations.etat9421.columns.netImposable' | translate }}</th>
                <th class="num" rowspan="2">{{ 'rh.paie.declarations.etat9421.columns.igrRetenu' | translate }}</th>
              </tr>
              <tr>
                <th class="num sub">{{ 'rh.paie.declarations.etat9421.columns.salaire' | translate }}</th>
                <th class="num sub">{{ 'rh.paie.declarations.etat9421.columns.indemnites' | translate }}</th>
                <th class="num sub">{{ 'rh.paie.declarations.etat9421.columns.totalBrut' | translate }}</th>
                <th class="num sub">{{ 'rh.paie.declarations.etat9421.columns.cnss' | translate }}</th>
                <th class="num sub">{{ 'rh.paie.declarations.etat9421.columns.amo' | translate }}</th>
                <th class="num sub">{{ 'rh.paie.declarations.etat9421.columns.fraisPro' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (l of lignes(); track l.employeId) {
                <tr>
                  <td class="cin">{{ l.cin }}</td>
                  <td>{{ l.nom }}</td>
                  <td class="num">{{ l.salaireAnnuel | mad:2 }}</td>
                  <td class="num">{{ l.indemnites | mad:2 }}</td>
                  <td class="num">{{ l.brutAnnuel | mad:2 }}</td>
                  <td class="num">{{ l.cnssAnnuel | mad:2 }}</td>
                  <td class="num">{{ l.amoAnnuel | mad:2 }}</td>
                  <td class="num">{{ l.fraisProAnnuel | mad:2 }}</td>
                  <td class="num">{{ l.netImposableAnnuel | mad:2 }}</td>
                  <td class="num danger-text">{{ l.igrAnnuel | mad:2 }}</td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="2"><strong>{{ 'rh.paie.declarations.common.totaux' | translate }}</strong></td>
                <td class="num"><strong>{{ totaux().salaires | mad:2 }}</strong></td>
                <td class="num"><strong>{{ totaux().indemnites | mad:2 }}</strong></td>
                <td class="num"><strong>{{ totaux().brut | mad:2 }}</strong></td>
                <td class="num"><strong>{{ totaux().cnss | mad:2 }}</strong></td>
                <td class="num"><strong>{{ totaux().amo | mad:2 }}</strong></td>
                <td class="num"><strong>{{ totaux().fraisPro | mad:2 }}</strong></td>
                <td class="num"><strong>{{ totaux().netImposable | mad:2 }}</strong></td>
                <td class="num danger-text"><strong>{{ totaux().igr | mad:2 }}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="attestation">
          <p>{{ 'rh.paie.declarations.etat9421.attestation.before' | translate }} <strong>{{ company.nom }}</strong>{{ 'rh.paie.declarations.etat9421.attestation.after' | translate }}</p>
          <div class="sig-row">
            <div class="sig-block"><p>{{ 'rh.paie.declarations.etat9421.attestation.dateCachet' | translate }}</p><div class="sig-zone"></div></div>
            <div class="sig-block"><p>{{ 'rh.paie.declarations.etat9421.attestation.recuAdmin' | translate }}</p><div class="sig-zone"></div></div>
          </div>
        </div>

      } @else {
        <div class="empty">{{ 'rh.paie.declarations.etat9421.empty' | translate: { annee: annee() } }}</div>
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
    .btn-export--print { background: var(--nf-color-text-secondary); }
    .btn-export--print:hover { background: var(--nf-color-text-primary); }
    .dgi-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 2rem; background: var(--nf-color-bg-subtle); border: 2px solid var(--nf-color-border); border-radius: 8px; padding: 1.1rem 1.25rem; margin-bottom: 1rem; }
    .dgi-logo strong { font-size: 1rem; color: var(--nf-color-text-primary); }
    .dgi-logo p { margin: 0.1rem 0; font-size: 12px; color: var(--nf-color-text-secondary); }
    .etat-num { margin-top: 0.5rem !important; font-size: 13px !important; font-weight: 700; color: var(--nf-color-primary-700) !important; }
    .ids-table { border-collapse: collapse; font-size: 12px; }
    .ids-table td { padding: 3px 10px; border: 1px solid var(--nf-color-border); }
    .ids-table td:first-child { font-weight: 600; background: var(--nf-color-bg-muted); width: 80px; }
    .table-wrap { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; margin-bottom: 1.25rem; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { padding: 8px 10px; background: var(--nf-color-text-primary); color: var(--nf-color-primary-contrast); font-weight: 600; text-align: left; white-space: nowrap; border: 1px solid var(--nf-color-text-primary); }
    th.num { text-align: right; }
    th.sub { background: var(--nf-color-text-primary); font-size: 11px; }
    td { padding: 6px 10px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.cin { font-family: monospace; font-size: 11px; color: var(--nf-color-text-secondary); }
    .danger-text { color: var(--nf-color-danger-700); }
    .total-row td { border-top: 2px solid var(--nf-color-text-primary); background: var(--nf-color-bg-subtle); font-size: 12.5px; padding: 7px 10px; }
    .total-row td.num { text-align: right; }
    .attestation { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; padding: 1.1rem 1.25rem; font-size: 12.5px; }
    .attestation p { margin: 0 0 1rem; }
    .sig-row { display: flex; gap: 2rem; }
    .sig-block { flex: 1; border: 1px solid var(--nf-color-border); padding: 0.75rem; text-align: center; }
    .sig-block p { font-size: 11px; margin: 0 0 0.25rem; }
    .sig-zone { height: 4rem; border-bottom: 1px solid var(--nf-color-border); }
    .empty { text-align: center; padding: 3rem; color: var(--nf-color-text-muted); }
    @media print { :host { font-size: 10pt; } .controls { display: none; } .table-wrap { overflow: visible; } }
  `],
})
export class IgrEtat9421Page {
  private readonly paieApi = inject(PaieApiService);
  private readonly translate = inject(TranslateService);
  readonly company = COMPANY;
  readonly annee = signal(2026);
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
    title: this.translate.instant('rh.paie.declarations.etat9421.title'),
    subtitle: this.translate.instant('rh.paie.declarations.etat9421.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('rh.common.module'), route: '/rh' },
      { label: this.translate.instant('rh.routes.paie.title'), route: '/rh/paie' },
      { label: this.translate.instant('rh.routes.etat9421.breadcrumb') },
    ],
  }));

  readonly lignes = computed(() => {
    const fiches = this.paieRows().filter(
      p => p.mois.startsWith(String(this.annee())) && p.status === 'PAYEE',
    );
    const byEmploye = new Map<string, typeof fiches>();
    fiches.forEach(f => {
      const arr = byEmploye.get(f.employeId) ?? [];
      arr.push(f);
      byEmploye.set(f.employeId, arr);
    });
    return [...byEmploye.entries()].map(([eid, fs]) => {
      const salaireAnnuel = fs.reduce((s, f) => s + f.salaireBase, 0);
      const indemnites = fs.reduce((s, f) => s + f.indemniteRepresentation + f.indemniteTransport, 0);
      const brutAnnuel = fs.reduce((s, f) => s + f.salaireBrut, 0);
      const cnssAnnuel = fs.reduce((s, f) => s + f.cotisationCNSS, 0);
      const amoAnnuel = fs.reduce((s, f) => s + f.cotisationAMO, 0);
      const fraisProAnnuel = Math.min(brutAnnuel * 0.35, 35000);
      const netImposableAnnuel = brutAnnuel - cnssAnnuel - amoAnnuel - fraisProAnnuel;
      const igrAnnuel = fs.reduce((s, f) => s + f.igr, 0);
      return {
        employeId: eid,
        cin: `CIN-${eid.slice(-5).toUpperCase()}`,
        nom: fs[0].employeNom ?? eid,
        salaireAnnuel,
        indemnites,
        brutAnnuel,
        cnssAnnuel,
        amoAnnuel,
        fraisProAnnuel: Math.round(fraisProAnnuel * 100) / 100,
        netImposableAnnuel: Math.round(netImposableAnnuel * 100) / 100,
        igrAnnuel,
      };
    });
  });

  readonly totaux = computed(() => {
    const l = this.lignes();
    return {
      salaires: l.reduce((s, r) => s + r.salaireAnnuel, 0),
      indemnites: l.reduce((s, r) => s + r.indemnites, 0),
      brut: l.reduce((s, r) => s + r.brutAnnuel, 0),
      cnss: l.reduce((s, r) => s + r.cnssAnnuel, 0),
      amo: l.reduce((s, r) => s + r.amoAnnuel, 0),
      fraisPro: l.reduce((s, r) => s + r.fraisProAnnuel, 0),
      netImposable: l.reduce((s, r) => s + r.netImposableAnnuel, 0),
      igr: l.reduce((s, r) => s + r.igrAnnuel, 0),
    };
  });

  exportXml(): void {
    const t = this.totaux();
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Etat9421 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Employeur>
    <IF>${this.company.if_num}</IF>
    <ICE>${this.company.ice}</ICE>
    <RaisonSociale>${this.company.nom}</RaisonSociale>
    <Exercice>${this.annee()}</Exercice>
  </Employeur>
  <Beneficiaires>
${this.lignes().map(l => `    <Beneficiaire>
      <CIN>${l.cin}</CIN>
      <NomPrenom>${l.nom}</NomPrenom>
      <RBrutAnnuel>${l.brutAnnuel.toFixed(2)}</RBrutAnnuel>
      <CNSS>${l.cnssAnnuel.toFixed(2)}</CNSS>
      <FraisPro>${l.fraisProAnnuel.toFixed(2)}</FraisPro>
      <RNetImposable>${l.netImposableAnnuel.toFixed(2)}</RNetImposable>
      <IGRRetenu>${l.igrAnnuel.toFixed(2)}</IGRRetenu>
    </Beneficiaire>`).join('\n')}
  </Beneficiaires>
  <Totaux>
    <TotalBrut>${t.brut.toFixed(2)}</TotalBrut>
    <TotalNetImposable>${t.netImposable.toFixed(2)}</TotalNetImposable>
    <TotalIGR>${t.igr.toFixed(2)}</TotalIGR>
  </Totaux>
</Etat9421>`;
    const blob = new Blob([xml], { type: 'application/xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Etat9421_${this.company.if_num}_${this.annee()}.xml`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  print(): void { window.print(); }
}
