import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type { BonCommande } from '@applications/erp/achats/models';

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
  selector: 'app-bc-print',
  standalone: true,
  imports: [CommonModule, MadCurrencyPipe, TranslateModule],
  template: `
    @if (bc()) {
      <article class="doc">
        <header class="doc-header">
          <div class="company-block">
            <div class="company-logo">🏗 <strong>{{ company.nom }}</strong></div>
            <p>{{ company.adresse }}, {{ company.ville }}</p>
            <p>{{ 'achats.commande.print.ids.phonePrefix' | translate }} {{ company.telephone }}</p>
          </div>
          <div class="ids-block">
            <table class="ids-table">
              <tr><td>{{ 'achats.commande.print.ids.ice' | translate }}</td><td>{{ company.ice }}</td></tr>
              <tr><td>{{ 'achats.commande.print.ids.if' | translate }}</td><td>{{ company.if_num }}</td></tr>
              <tr><td>{{ 'achats.commande.print.ids.rc' | translate }}</td><td>{{ company.rc }}</td></tr>
            </table>
          </div>
        </header>

        <hr class="doc-sep"/>

        <div class="doc-title-block">
          <h2 class="doc-title">{{ 'achats.commande.print.title' | translate:{ numero: bc()!.numero } }}</h2>
          <div class="doc-dates">
            <p>{{ 'achats.commande.print.dateLabel' | translate }} {{ bc()!.dateCreation | date:'dd/MM/yyyy' }}</p>
            <p>{{ 'achats.commande.print.livraisonLabel' | translate }} {{ bc()!.dateLivraisonPrevue | date:'dd/MM/yyyy' }}</p>
          </div>
        </div>

        <div class="parties">
          <div class="partie">
            <h3>{{ 'achats.commande.print.fournisseur' | translate }}</h3>
            <p><strong>{{ bc()!.fournisseurName ?? '—' }}</strong></p>
          </div>
          <div class="partie">
            <h3>{{ 'achats.commande.print.chantierLivraison' | translate }}</h3>
            <p><strong>{{ bc()!.chantierCode ?? '—' }}</strong> {{ bc()!.chantierName ? '— ' + bc()!.chantierName : '' }}</p>
            <p>{{ 'achats.commande.print.conditionsPaiementLabel' | translate }} {{ bc()!.conditionsPaiement }}</p>
          </div>
        </div>

        <table class="lignes">
          <thead>
            <tr>
              <th class="wide">{{ 'achats.commande.print.columns.designation' | translate }}</th>
              <th>{{ 'achats.commande.print.columns.code' | translate }}</th>
              <th class="num">{{ 'achats.commande.print.columns.qte' | translate }}</th>
              <th>{{ 'achats.commande.print.columns.unite' | translate }}</th>
              <th class="num">{{ 'achats.commande.print.columns.puHt' | translate }}</th>
              <th class="num">{{ 'achats.commande.print.columns.totalHt' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (l of bc()!.lignes; track l.id) {
              <tr>
                <td>{{ l.articleName ?? '—' }}</td>
                <td class="code">{{ l.articleCode ?? '' }}</td>
                <td class="num">{{ l.quantite }}</td>
                <td>{{ l.uomCode ?? '' }}</td>
                <td class="num">{{ l.prixUnitaireHt | mad:2 }}</td>
                <td class="num">{{ l.totalHt | mad:2 }}</td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr><td colspan="5"><strong>{{ 'achats.commande.print.totals.totalHt' | translate }}</strong></td><td class="num">{{ bc()!.totalHt | mad:2 }}</td></tr>
            <tr><td colspan="5">{{ 'achats.commande.print.totals.tva' | translate:{ rate: bc()!.tvaTaux } }}</td><td class="num">{{ (bc()!.totalTtc - bc()!.totalHt) | mad:2 }}</td></tr>
            <tr class="total"><td colspan="5"><strong>{{ 'achats.commande.print.totals.totalTtc' | translate }}</strong></td><td class="num"><strong>{{ bc()!.totalTtc | mad:2 }}</strong></td></tr>
          </tfoot>
        </table>

        @if (bc()!.notes) {
          <div class="notes"><p><strong>{{ 'achats.commande.print.notesLabel' | translate }}</strong> {{ bc()!.notes }}</p></div>
        }

        <div class="signatures">
          <div class="sig-block"><p>{{ 'achats.commande.print.signatureAcheteur' | translate }}</p><div class="sig-zone"></div></div>
          <div class="sig-block"><p>{{ 'achats.commande.print.signatureFournisseur' | translate }}</p><div class="sig-zone"></div></div>
        </div>

        <footer class="doc-footer">
          <p>{{ company.nom }} — SARL AU — {{ company.rc }} — {{ 'achats.commande.print.ids.ice' | translate }} {{ company.ice }}</p>
        </footer>
      </article>
    }
  `,
  styles: [`
    :host { display: block; font-family: 'Times New Roman', serif; font-size: 11pt; color: black; }
    .doc { max-width: 210mm; margin: 0 auto; padding: 1.5cm; }
    .doc-header { display: flex; justify-content: space-between; padding-bottom: 1rem; }
    .company-block { max-width: 55%; }
    .company-logo { font-size: 13pt; font-weight: 700; margin-bottom: 0.25rem; }
    .company-block p { margin: 0.1rem 0; font-size: 9pt; }
    .ids-table { border-collapse: collapse; font-size: 9pt; }
    .ids-table td { padding: 2px 8px; border: 1px solid var(--nf-color-text-muted); }
    .ids-table td:first-child { font-weight: 600; background: var(--nf-color-bg-muted); }
    .doc-sep { border: none; border-top: 2px solid black; margin: 0.75rem 0; }
    .doc-title-block { display: flex; justify-content: space-between; margin-bottom: 1rem; }
    .doc-title { font-size: 14pt; font-weight: 700; margin: 0; text-transform: uppercase; }
    .doc-dates p { margin: 0.1rem 0; font-size: 9.5pt; }
    .parties { display: flex; gap: 2rem; margin-bottom: 1rem; }
    .partie { flex: 1; border: 1px solid var(--nf-color-text-muted); padding: 0.6rem; }
    .partie h3 { margin: 0 0 0.3rem; font-size: 9pt; color: var(--nf-color-text-secondary); text-transform: uppercase; }
    .partie p { margin: 0.1rem 0; font-size: 10pt; }
    .lignes { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    .lignes th { padding: 6px 8px; background: var(--nf-text-primary); color: white; text-align: left; font-size: 10pt; }
    .lignes th.num, .lignes td.num { text-align: right; }
    .lignes th.wide { width: 40%; }
    .lignes td { padding: 5px 8px; border-bottom: 1px solid var(--nf-color-border); font-size: 10pt; }
    .lignes td.code { font-size: 9pt; color: var(--nf-color-text-secondary); }
    .lignes tfoot td { padding: 6px 8px; font-size: 10pt; border-top: 1px solid var(--nf-color-text-muted); }
    .lignes tfoot tr.total td { background: var(--nf-text-primary); color: white; font-size: 11pt; border-top: 2px solid black; }
    .notes { border: 1px solid var(--nf-color-border); border-radius: 4px; padding: 0.5rem 0.75rem; margin-bottom: 1rem; font-size: 9.5pt; }
    .signatures { display: flex; gap: 2rem; margin-bottom: 1.5rem; }
    .sig-block { flex: 1; border: 1px solid var(--nf-color-text-muted); padding: 0.6rem; text-align: center; }
    .sig-block p { margin: 0 0 0.25rem; font-size: 9pt; }
    .sig-zone { height: 4rem; border-bottom: 1px solid var(--nf-color-text-muted); margin-bottom: 0.25rem; }
    .doc-footer { border-top: 1px solid var(--nf-color-text-muted); padding-top: 0.4rem; text-align: center; font-size: 8pt; color: var(--nf-color-text-secondary); }
    @media print { @page { size: A4; margin: 1cm; } :host { -webkit-print-color-adjust: exact; } .doc { padding: 0; } }
  `],
})
export class BcPrintComponent {
  readonly bc = input<BonCommande | null>(null);
  readonly company = COMPANY;
}
