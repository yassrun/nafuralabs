import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type { Situation } from '@applications/erp/chantiers/models';

const COMPANY = {
  nom: 'Nafura BTP SARL',
  adresse: 'Bd Mohammed Zerktouni, Résidence Yasmine B, Bureau 8',
  ville: 'Casablanca 20100',
  telephone: '+212 5 22 00 00 00',
  ice: '002345678901234',
  if_num: '87654321',
  rc: 'RC Casa 715869',
};

@Component({
  selector: 'app-situation-print',
  standalone: true,
  imports: [CommonModule, MadCurrencyPipe, TranslateModule],
  template: `
    @if (sit()) {
      <article class="doc">
        <header class="doc-header">
          <div class="company-block">
            <p class="company-name">{{ company.nom }}</p>
            <p>{{ company.adresse }}, {{ company.ville }}</p>
            <p>ICE {{ company.ice }} · I.F. {{ company.if_num }} · {{ company.rc }}</p>
          </div>
          <div class="sit-id">
            <h2>{{ 'chantiers.situation.print.title' | translate:{ n: sit()!.numero } }}</h2>
            <p>{{ 'chantiers.situation.print.periode' | translate:{ from: (sit()!.datePeriodeDebut | date:'dd/MM/yyyy'), to: (sit()!.datePeriodeFin | date:'dd/MM/yyyy') } }}</p>
            <p>Chantier : <strong>{{ sit()!.chantierCode }} — {{ sit()!.chantierName }}</strong></p>
          </div>
        </header>

        <hr class="doc-sep"/>

        <table class="decomp">
          <thead>
            <tr>
              <th>{{ 'chantiers.situation.print.columns.lotDesignation' | translate }}</th>
              <th>{{ 'chantiers.situation.print.columns.unite' | translate }}</th>
              <th class="num">Prix U. HT</th>
              <th class="num">{{ 'chantiers.situation.print.columns.qteCumulee' | translate }}</th>
              <th class="num">{{ 'chantiers.situation.print.columns.montantHt' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (l of sit()!.lignes; track l.id) {
              <tr>
                <td>{{ l.designation }}</td>
                <td>{{ l.unite ?? '' }}</td>
                <td class="num">{{ l.prixUnitaire | mad:2 }}</td>
                <td class="num">{{ l.quantiteCumulee }}</td>
                <td class="num">{{ l.montantHt | mad:2 }}</td>
              </tr>
            }
          </tbody>
        </table>

        <table class="recap">
          <tbody>
            <tr><td>{{ 'chantiers.situation.print.cumulPrecedent' | translate:{ n: sit()!.numeroOrdre - 1 } }}</td><td class="num">{{ sit()!.cumulPrecedentHt | mad:2 }}</td></tr>
            <tr class="accent"><td><strong>Cumul courant HT</strong></td><td class="num"><strong>{{ sit()!.cumulCourantHt | mad:2 }}</strong></td></tr>
            <tr><td>{{ 'chantiers.situation.print.travauxPeriodeHt' | translate }}</td><td class="num">{{ sit()!.travauxPeriodeHt | mad:2 }}</td></tr>
            <tr class="deduction"><td>{{ 'chantiers.situation.print.retenueGarantiePct' | translate:{ pct: sit()!.retenueGarantiePercent } }}</td><td class="num">− {{ sit()!.retenueGarantieMontant | mad:2 }}</td></tr>
            @if (sit()!.retenueAvanceMontant) {
              <tr class="deduction"><td>Remboursement avance {{ sit()!.retenueAvancePercent }}%</td><td class="num">− {{ sit()!.retenueAvanceMontant | mad:2 }}</td></tr>
            }
            <tr class="subtotal"><td><strong>{{ 'chantiers.situation.print.netHt' | translate }}</strong></td><td class="num"><strong>{{ sit()!.netAPayerHt | mad:2 }}</strong></td></tr>
            <tr><td>TVA {{ sit()!.tvaTaux }}%</td><td class="num">{{ (sit()!.netAPayerTtc - sit()!.netAPayerHt) | mad:2 }}</td></tr>
            <tr class="total"><td><strong>{{ 'chantiers.situation.print.netTtc' | translate }}</strong></td><td class="num"><strong>{{ sit()!.netAPayerTtc | mad:2 }}</strong></td></tr>
          </tbody>
        </table>

        @if (sit()!.notes) {
          <p class="notes"><strong>Observations :</strong> {{ sit()!.notes }}</p>
        }

        <div class="signatures">
          <div class="sig-block">
            <p>{{ 'chantiers.situation.print.etabliPar' | translate }}</p>
            <div class="sig-zone"></div>
            <p>{{ company.nom }}</p>
          </div>
          <div class="sig-block">
            <p>{{ 'chantiers.situation.print.visaMoa' | translate }}</p>
            <div class="sig-zone"></div>
            @if (sit()!.approbateurMOAName) { <p>{{ sit()!.approbateurMOAName }}</p> }
            @if (sit()!.approbationDate) { <p>{{ sit()!.approbationDate | date:'dd/MM/yyyy' }}</p> }
          </div>
        </div>

        <footer class="doc-footer">
          <p>{{ 'chantiers.situation.print.companyLine' | translate:{ raison: company.nom, ice: company.ice } }} {{ company.rc }}</p>
          <p>{{ 'chantiers.situation.print.footer' | translate:{ n: sit()!.numero, from: (sit()!.datePeriodeDebut | date:'MM/yyyy'), to: (sit()!.datePeriodeFin | date:'MM/yyyy') } }}</p>
        </footer>
      </article>
    }
  `,
  styles: [`
    :host { display: block; font-family: 'Times New Roman', serif; font-size: 11pt; color: var(--nf-text-primary); }
    .doc { max-width: 210mm; margin: 0 auto; padding: 1.5cm; }
    .doc-header { display: flex; justify-content: space-between; gap: 2rem; padding-bottom: 1rem; }
    .company-block { font-size: 9.5pt; }
    .company-name { font-size: 13pt; font-weight: 700; margin: 0 0 0.25rem; }
    .company-block p { margin: 0.1rem 0; }
    .sit-id { text-align: right; }
    .sit-id h2 { margin: 0 0 0.4rem; font-size: 13pt; font-weight: 700; text-transform: uppercase; }
    .sit-id p { margin: 0.1rem 0; font-size: 9.5pt; }
    .doc-sep { border: none; border-top: 2px solid var(--nf-text-primary); margin: 0.75rem 0; }
    .decomp { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    .decomp th { padding: 6px 8px; background: var(--nf-text-primary); color: var(--nf-color-primary-contrast); font-size: 10pt; text-align: left; }
    .decomp th.num { text-align: right; }
    .decomp td { padding: 5px 8px; border-bottom: 1px solid var(--nf-color-border); font-size: 10pt; }
    .decomp td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .recap { width: 50%; margin-left: auto; border-collapse: collapse; margin-bottom: 1rem; }
    .recap td { padding: 5px 10px; font-size: 10.5pt; border-bottom: 1px solid var(--nf-color-border); }
    .recap td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .recap .accent { background: var(--nf-color-primary-50); }
    .recap .deduction td { color: var(--nf-color-danger-700); }
    .recap .subtotal td { border-top: 2px solid var(--nf-text-primary); border-bottom: 2px solid var(--nf-text-primary); font-size: 11pt; }
    .recap .total td { background: var(--nf-text-primary); color: var(--nf-color-primary-contrast); font-size: 12pt; border: none; padding: 8px 10px; }
    .notes { border: 1px solid var(--nf-color-border); border-radius: 4px; padding: 0.5rem; margin-bottom: 1rem; font-size: 9.5pt; }
    .signatures { display: flex; gap: 2rem; margin-bottom: 1.5rem; }
    .sig-block { flex: 1; border: 1px solid var(--nf-color-text-muted); padding: 0.6rem; text-align: center; }
    .sig-block p { margin: 0.2rem 0; font-size: 9pt; }
    .sig-zone { height: 4rem; border-bottom: 1px solid var(--nf-color-text-muted); margin: 0.5rem 0; }
    .doc-footer { border-top: 1px solid var(--nf-color-text-muted); padding-top: 0.4rem; text-align: center; font-size: 8pt; color: var(--nf-color-text-secondary); }
    @media print { @page { size: A4; margin: 1cm; } :host { -webkit-print-color-adjust: exact; } .doc { padding: 0; } }
  `],
})
export class SituationPrintComponent {
  readonly sit = input<Situation | null>(null);
  readonly company = COMPANY;
}
