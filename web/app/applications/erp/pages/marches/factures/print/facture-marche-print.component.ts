import { Component, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { FactureMarcheApiService } from '../services/facture-marche-api.service';
import { ContratMarcheApiService } from '../../contrats/services/contrat-marche-api.service';
import type { FactureMarche, Marche } from '../../models';

const COMPANY = {
  nom: 'Nafura BTP SARL',
  formeJuridique: 'SARL à Associé Unique',
  adresse: 'Bd Mohammed Zerktouni, Résidence Yasmine B, 2ème étage, Bureau 8',
  ville: 'Casablanca 20100',
  telephone: '+212 5 22 XX XX XX',
  email: 'contact@nafura-btp.ma',
  ice: '002345678901234',
  if_num: '87654321',
  rc: 'RC Casa 715869',
  capital: 1000000,
  cnss: '1234567',
  taxePro: 'TP-20-00000',
};

@Component({
  selector: 'app-facture-marche-print',
  standalone: true,
  imports: [CommonModule, MadCurrencyPipe, TranslateModule],
  template: `
    @if (facture()) {
      <article class="doc">
        <header class="doc-header">
          <div class="company-block">
            <div class="company-logo">🏗</div>
            <div class="company-info">
              <h1 class="company-name">{{ company.nom }}</h1>
              <p>{{ company.adresse }}</p>
              <p>{{ company.ville }}</p>
              <p>{{ company.telephone }} · {{ company.email }}</p>
            </div>
          </div>
          <div class="ids-block">
            <table class="ids-table">
              <tr><td>{{ 'marches.factureMarche.print.ids.ice' | translate }}</td><td>{{ company.ice }}</td></tr>
              <tr><td>{{ 'marches.factureMarche.print.ids.if' | translate }}</td><td>{{ company.if_num }}</td></tr>
              <tr><td>{{ 'marches.factureMarche.print.ids.rc' | translate }}</td><td>{{ company.rc }}</td></tr>
              <tr><td>{{ 'marches.factureMarche.print.ids.taxePro' | translate }}</td><td>{{ company.taxePro }}</td></tr>
              <tr><td>{{ 'marches.factureMarche.print.ids.cnss' | translate }}</td><td>{{ company.cnss }}</td></tr>
            </table>
          </div>
        </header>

        <hr class="doc-sep"/>

        <div class="doc-title-block">
          <h2 class="doc-title">{{ 'marches.factureMarche.print.docTitle' | translate:{ numero: facture()!.numero } }}</h2>
          <div class="doc-dates">
            <p>{{ 'marches.factureMarche.print.dateEmissionLabel' | translate:{ date: (facture()!.dateEmission | date:'dd/MM/yyyy') } }}</p>
            <p>{{ 'marches.factureMarche.print.dateEcheanceLabel' | translate:{ date: (facture()!.dateEcheance | date:'dd/MM/yyyy') } }}</p>
          </div>
        </div>

        <div class="parties">
          <div class="partie partie--client">
            <h3>{{ 'marches.factureMarche.print.partieClient.title' | translate }}</h3>
            <p><strong>{{ facture()!.clientNom }}</strong></p>
            @if (marche()?.clientIce) { <p>{{ 'marches.factureMarche.print.partieClient.iceLine' | translate:{ value: marche()!.clientIce } }}</p> }
            @if (marche()?.clientIf) { <p>{{ 'marches.factureMarche.print.partieClient.ifLine' | translate:{ value: marche()!.clientIf } }}</p> }
          </div>
          <div class="partie partie--ref">
            <h3>{{ 'marches.factureMarche.print.partieRef.title' | translate }}</h3>
            <p>{{ 'marches.factureMarche.print.partieRef.marcheLine' | translate:{ numero: facture()!.marcheNumero } }}</p>
            <p>{{ 'marches.factureMarche.print.partieRef.chantierLine' | translate:{ code: facture()!.chantierCode } }}</p>
          </div>
        </div>

        <table class="decompte">
          <thead>
            <tr>
              <th class="wide">{{ 'marches.factureMarche.print.decompte.designation' | translate }}</th>
              <th class="num">{{ 'marches.factureMarche.print.decompte.montantHt' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ 'marches.factureMarche.print.decompte.travauxExecutes' | translate }}</td>
              <td class="num">{{ facture()!.montantBrutHt | mad:2 }}</td>
            </tr>
            @if (facture()!.avanceDeduiteHt > 0) {
              <tr class="deduction">
                <td>{{ 'marches.factureMarche.print.decompte.deductionAvance' | translate }}</td>
                <td class="num">− {{ facture()!.avanceDeduiteHt | mad:2 }}</td>
              </tr>
            }
            <tr class="deduction">
              <td>{{ 'marches.factureMarche.print.decompte.retenueGarantie' | translate:{ rate: marche()?.retenueGarantieTaux ?? 7 } }}</td>
              <td class="num">− {{ facture()!.retenueGarantieHt | mad:2 }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="subtotal">
              <td><strong>{{ 'marches.factureMarche.print.decompte.netHt' | translate }}</strong></td>
              <td class="num"><strong>{{ facture()!.netHt | mad:2 }}</strong></td>
            </tr>
            <tr>
              <td>{{ 'marches.factureMarche.print.decompte.tva' | translate:{ rate: facture()!.tvaTaux } }}</td>
              <td class="num">{{ facture()!.tvaMontant | mad:2 }}</td>
            </tr>
            <tr class="subtotal">
              <td><strong>{{ 'marches.factureMarche.print.decompte.netTtc' | translate }}</strong></td>
              <td class="num"><strong>{{ facture()!.netTtc | mad:2 }}</strong></td>
            </tr>
            @if (facture()!.retenueSourceTaux > 0) {
              <tr class="deduction">
                <td>{{ 'marches.factureMarche.print.decompte.retenueSource' | translate:{ rate: facture()!.retenueSourceTaux } }}</td>
                <td class="num">− {{ facture()!.retenueSourceMontant | mad:2 }}</td>
              </tr>
            }
            @if (facture()!.timbreFiscal > 0) {
              <tr class="deduction">
                <td>{{ 'marches.factureMarche.print.decompte.timbreFiscal' | translate }}</td>
                <td class="num">− {{ facture()!.timbreFiscal | mad:2 }}</td>
              </tr>
            }
            <tr class="total">
              <td><strong>{{ 'marches.factureMarche.print.decompte.netAPayer' | translate }}</strong></td>
              <td class="num total-amount"><strong>{{ facture()!.netAPayer | mad:2 }}</strong></td>
            </tr>
          </tfoot>
        </table>

        <div class="conditions">
          <p><strong>{{ 'marches.factureMarche.print.conditions.modeLabel' | translate }}</strong> {{ 'marches.factureMarche.print.conditions.modeValue' | translate }}</p>
          <p><strong>{{ 'marches.factureMarche.print.conditions.ribLabel' | translate }}</strong> {{ 'marches.factureMarche.print.conditions.ribValue' | translate }}</p>
          <p class="legal">{{ 'marches.factureMarche.print.conditions.legal' | translate }}</p>
        </div>

        <div class="signatures">
          <div class="sig-block">
            <p>{{ 'marches.factureMarche.print.signatures.prestataire' | translate }}</p>
            <div class="sig-zone"></div>
            <p>{{ company.nom }}</p>
          </div>
          <div class="sig-block">
            <p>{{ 'marches.factureMarche.print.signatures.moa' | translate }}</p>
            <div class="sig-zone"></div>
            <p>{{ facture()!.clientNom }}</p>
          </div>
        </div>

        <footer class="doc-footer">
          <p>{{ 'marches.factureMarche.print.footer.capitalLine' | translate:{ nom: company.nom, forme: company.formeJuridique, capital: (company.capital | mad), rc: company.rc } }}</p>
          <p>{{ 'marches.factureMarche.print.footer.idsLine' | translate:{ ice: company.ice, if: company.if_num, cnss: company.cnss } }}</p>
        </footer>
      </article>
    }
  `,
  styles: [`
    :host { display: block; font-family: 'Times New Roman', serif; color: var(--nf-color-text-primary); font-size: 11pt; }

    .doc { max-width: 210mm; margin: 0 auto; padding: 1.5cm; }

    .doc-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1rem; }
    .company-block { display: flex; gap: 1rem; align-items: flex-start; }
    .company-logo { font-size: 3rem; line-height: 1; }
    .company-name { font-size: 14pt; font-weight: 700; margin: 0 0 0.3rem; }
    .company-info p { margin: 0.1rem 0; font-size: 9pt; }
    .ids-table { border-collapse: collapse; font-size: 9pt; }
    .ids-table td { padding: 2px 8px; border: 1px solid var(--nf-color-text-muted); }
    .ids-table td:first-child { font-weight: 600; background: var(--nf-color-bg-subtle); }

    .doc-sep { border: none; border-top: 2px solid var(--nf-color-text-primary); margin: 0.75rem 0; }

    .doc-title-block { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
    .doc-title { font-size: 16pt; font-weight: 700; margin: 0; text-transform: uppercase; border-bottom: 2px solid var(--nf-color-text-primary); padding-bottom: 0.25rem; }
    .doc-dates p { margin: 0.15rem 0; font-size: 10pt; }

    .parties { display: flex; gap: 2rem; margin-bottom: 1.25rem; }
    .partie { flex: 1; border: 1px solid var(--nf-color-text-muted); padding: 0.75rem; }
    .partie h3 { margin: 0 0 0.4rem; font-size: 9pt; text-transform: uppercase; color: var(--nf-color-text-secondary); }
    .partie p { margin: 0.1rem 0; font-size: 10pt; }

    .decompte { width: 100%; border-collapse: collapse; margin-bottom: 1.25rem; }
    .decompte th { padding: 7px 10px; background: var(--nf-color-text-primary); color: var(--nf-color-primary-contrast); text-align: left; font-size: 10pt; }
    .decompte th.num { text-align: right; }
    .decompte td { padding: 6px 10px; border-bottom: 1px solid var(--nf-color-border); font-size: 10pt; }
    .decompte td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .decompte td.wide { width: 70%; }
    .decompte .deduction td { color: var(--nf-color-danger-700); }
    .decompte .subtotal td { border-top: 2px solid var(--nf-color-text-primary); border-bottom: 2px solid var(--nf-color-text-primary); padding: 8px 10px; background: var(--nf-color-bg-subtle); }
    .decompte .total td { background: var(--nf-color-text-primary); color: var(--nf-color-primary-contrast); padding: 10px; font-size: 12pt; }
    .decompte .total .total-amount { color: var(--nf-color-primary-contrast); }

    .conditions { margin-bottom: 1.25rem; font-size: 9.5pt; }
    .conditions p { margin: 0.3rem 0; }
    .legal { font-style: italic; color: var(--nf-color-text-secondary); font-size: 8.5pt; margin-top: 0.75rem; }

    .signatures { display: flex; gap: 2rem; margin-bottom: 1.5rem; }
    .sig-block { flex: 1; border: 1px solid var(--nf-color-text-muted); padding: 0.75rem; text-align: center; }
    .sig-block p { margin: 0.2rem 0; font-size: 9pt; }
    .sig-zone { height: 4rem; border-bottom: 1px solid var(--nf-color-text-muted); margin: 0.5rem 0; }

    .doc-footer { border-top: 1px solid var(--nf-color-text-muted); padding-top: 0.5rem; text-align: center; font-size: 8pt; color: var(--nf-color-text-secondary); }
    .doc-footer p { margin: 0.15rem 0; }

    @media print {
      @page { size: A4; margin: 1cm; }
      :host { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .doc { padding: 0; }
    }
  `],
})
export class FactureMarChePrintComponent {
  readonly factureId = input.required<string>();

  private readonly api = inject(FactureMarcheApiService);
  private readonly contratApi = inject(ContratMarcheApiService);

  readonly company = COMPANY;

  readonly facture = signal<FactureMarche | undefined>(undefined);
  readonly marche = signal<Marche | undefined>(undefined);

  constructor() {
    effect(() => {
      void this.loadFacture(this.factureId());
    });
  }

  private async loadFacture(id: string): Promise<void> {
    if (!id) return;
    try {
      const facture = await this.api.getById(id);
      this.facture.set(facture);
      try {
        this.marche.set(await this.contratApi.getById(facture.marcheId));
      } catch {
        this.marche.set(undefined);
      }
    } catch {
      this.facture.set(undefined);
      this.marche.set(undefined);
    }
  }
}
