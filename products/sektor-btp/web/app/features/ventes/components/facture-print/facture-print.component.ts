import { CommonModule } from '@angular/common';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { FactureClient } from '../../models';

/**
 * Template imprimable de facture officielle conforme aux exigences fiscales
 * marocaines : raison sociale, ICE/RC/IF/Patente/CNSS, client + ICE,
 * lignes détaillées, HT, TVA détaillée par taux, TTC, mention "Facturé en MAD",
 * mode paiement, RIB, cachet société.
 *
 * Utilisé via `window.print()` depuis la page détail. Les styles `@media print`
 * masquent les chrome de l'application autour.
 */
@Component({
  selector: 'app-facture-print',
  standalone: true,
  imports: [CommonModule, MadCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="fp" data-print-area="facture">
      <header class="fp__header">
        <div class="fp__company">
          <h1>SEYRURA BTP SARL</h1>
          <p>47 Boulevard Zerktouni, Casablanca 20100 — Maroc</p>
          <p>Tél : +212 522 36 78 90 — contact&#64;seyrura.ma</p>
          <ul class="fp__legal">
            <li>ICE : 002847593000087</li>
            <li>RC : 715869 — Casablanca</li>
            <li>IF : 40297583</li>
            <li>Patente : 35628471</li>
            <li>CNSS : 9847562</li>
            <li>Capital : 1 000 000 MAD</li>
          </ul>
        </div>
        <div class="fp__meta">
          <h2>FACTURE</h2>
          <table>
            <tr>
              <th>N°</th>
              <td>{{ facture().numero }}</td>
            </tr>
            <tr>
              <th>Date émission</th>
              <td>{{ formatDate(facture().dateEmission) }}</td>
            </tr>
            <tr>
              <th>Date échéance</th>
              <td>{{ formatDate(facture().dateEcheance) }}</td>
            </tr>
            <tr>
              <th>Type</th>
              <td>{{ typeLabel() }}</td>
            </tr>
            @if (facture().chantierCode) {
              <tr>
                <th>Chantier</th>
                <td>{{ facture().chantierCode }}</td>
              </tr>
            }
            @if (facture().bcClientId) {
              <tr>
                <th>BC Client</th>
                <td>{{ facture().bcClientId }}</td>
              </tr>
            }
          </table>
        </div>
      </header>

      <section class="fp__client">
        <h3>Doit</h3>
        <p class="fp__client-name">{{ facture().clientName }}</p>
        <p class="fp__client-id">
          ICE Client : <strong>—</strong>
        </p>
      </section>

      <table class="fp__lines">
        <thead>
          <tr>
            <th>Désignation</th>
            <th class="num">Qté</th>
            <th class="num">P.U. HT</th>
            <th class="num">Total HT</th>
          </tr>
        </thead>
        <tbody>
          @for (l of facture().lignes; track l.id) {
            <tr>
              <td>{{ l.designation }}</td>
              <td class="num">{{ l.quantite ?? '—' }} {{ l.unite ?? '' }}</td>
              <td class="num">
                {{ l.prixUnitaireHt != null ? (l.prixUnitaireHt | mad:2) : '—' }}
              </td>
              <td class="num">{{ l.totalHt | mad:2 }}</td>
            </tr>
          }
        </tbody>
      </table>

      <section class="fp__totaux">
        <div class="fp__totaux-grid">
          <div>
            <span>Total HT</span>
            <strong>{{ facture().totalHt | mad:2 }}</strong>
          </div>
          @if (facture().retenueGarantieMontant > 0) {
            <div>
              <span>Retenue garantie (7 %)</span>
              <strong>− {{ facture().retenueGarantieMontant | mad:2 }}</strong>
            </div>
          }
          @if (facture().resorptionAvanceMontant && facture().resorptionAvanceMontant! > 0) {
            <div>
              <span>Résorption avance</span>
              <strong>− {{ facture().resorptionAvanceMontant | mad:2 }}</strong>
            </div>
          }
          <div class="fp__totaux-net">
            <span>Net à payer HT</span>
            <strong>{{ facture().netAPayerHt | mad:2 }}</strong>
          </div>
          <div>
            <span>TVA {{ facture().tvaTaux }} %</span>
            <strong>{{ facture().totalTva | mad:2 }}</strong>
          </div>
          <div class="fp__totaux-ttc">
            <span>Net à payer TTC</span>
            <strong>{{ facture().netAPayerTtc | mad:2 }}</strong>
          </div>
        </div>
        <p class="fp__mention">
          Arrêté la présente facture à la somme de <strong>{{ facture().netAPayerTtc | mad:2 }}</strong>.
          Facturé en MAD (dirhams marocains).
        </p>
      </section>

      <section class="fp__payment">
        <div>
          <h4>Modalités de paiement</h4>
          <p>{{ paymentLabel() }}</p>
          <p>Échéance : {{ formatDate(facture().dateEcheance) }}</p>
        </div>
        <div>
          <h4>Coordonnées bancaires</h4>
          <p>BMCE Bank of Africa — Agence Casa Anfa</p>
          <p>RIB : 011 780 0000123456789012 34</p>
          <p>SWIFT : BMCEMAMC</p>
        </div>
      </section>

      <footer class="fp__footer">
        <div class="fp__cachet">
          <span>Cachet et signature</span>
        </div>
        <p class="fp__small">
          Tout retard de paiement entraînera l'application d'intérêts moratoires conformément à la
          réglementation en vigueur. Conditions générales de vente disponibles sur demande.
        </p>
      </footer>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .fp {
        background: var(--nf-color-surface);
        color: var(--nf-text-primary);
        padding: 24px;
        max-width: 880px;
        margin: 0 auto;
        font-family: 'Inter', 'Segoe UI', sans-serif;
        font-size: 12px;
      }
      .fp__header {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        border-bottom: 2px solid var(--nf-text-primary);
        padding-bottom: 12px;
        margin-bottom: 16px;
      }
      .fp__company h1 {
        margin: 0;
        font-size: 20px;
        color: var(--nf-color-primary-700);
      }
      .fp__company p {
        margin: 2px 0;
        font-size: 11px;
      }
      .fp__legal {
        list-style: none;
        padding: 0;
        margin: 6px 0 0;
        font-size: 11px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 12px;
      }
      .fp__meta {
        text-align: right;
        min-width: 240px;
      }
      .fp__meta h2 {
        margin: 0 0 8px;
        font-size: 22px;
        color: var(--nf-color-primary-700);
        letter-spacing: 0.08em;
      }
      .fp__meta table {
        width: 100%;
        font-size: 11px;
      }
      .fp__meta th {
        text-align: left;
        font-weight: 500;
        color: var(--nf-color-text-secondary);
        padding-right: 8px;
      }
      .fp__meta td {
        text-align: right;
        font-weight: 600;
      }
      .fp__client {
        background: var(--nf-color-bg-subtle);
        border: 1px solid var(--nf-color-border);
        border-radius: 6px;
        padding: 10px 12px;
        margin-bottom: 16px;
      }
      .fp__client h3 {
        margin: 0;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--nf-color-text-secondary);
      }
      .fp__client-name {
        margin: 4px 0 0;
        font-weight: 700;
        font-size: 14px;
      }
      .fp__client-id {
        margin: 2px 0 0;
        font-size: 11px;
        color: var(--nf-color-text-secondary);
      }
      .fp__lines {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 12px;
      }
      .fp__lines th,
      .fp__lines td {
        padding: 8px 10px;
        border-bottom: 1px solid var(--nf-color-border);
        font-size: 11px;
      }
      .fp__lines th {
        background: var(--nf-color-bg-muted);
        text-align: left;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--nf-color-text-secondary);
      }
      .fp__lines td.num,
      .fp__lines th.num {
        text-align: right;
        white-space: nowrap;
      }
      .fp__totaux {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
      }
      .fp__totaux-grid {
        width: min(360px, 100%);
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .fp__totaux-grid > div {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 4px 0;
        font-size: 12px;
      }
      .fp__totaux-net {
        border-top: 1px dashed var(--nf-color-border);
        margin-top: 6px;
        padding-top: 6px;
      }
      .fp__totaux-ttc {
        border-top: 2px solid var(--nf-color-primary-700);
        background: var(--nf-color-primary-700);
        color: var(--nf-color-surface);
        padding: 8px 10px;
        border-radius: 6px;
        margin-top: 6px;
        font-weight: 700;
      }
      .fp__totaux-ttc strong {
        color: var(--nf-color-surface);
      }
      .fp__mention {
        font-size: 11px;
        color: var(--nf-color-text-secondary);
        font-style: italic;
        text-align: right;
      }
      .fp__payment {
        margin-top: 16px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        padding: 10px 0;
        border-top: 1px dashed var(--nf-color-border);
        border-bottom: 1px dashed var(--nf-color-border);
      }
      .fp__payment h4 {
        margin: 0 0 4px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--nf-color-text-secondary);
      }
      .fp__payment p {
        margin: 2px 0;
        font-size: 11px;
      }
      .fp__footer {
        margin-top: 16px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        align-items: end;
      }
      .fp__cachet {
        border: 1px dashed var(--nf-color-text-muted);
        height: 90px;
        border-radius: 8px;
        display: flex;
        align-items: end;
        justify-content: center;
        padding: 6px;
        color: var(--nf-color-text-muted);
        font-size: 10px;
      }
      .fp__small {
        font-size: 10px;
        color: var(--nf-color-text-muted);
      }
      @media print {
        :host {
          background: var(--nf-color-surface);
        }
        .fp {
          padding: 0;
        }
      }
    `,
  ],
})
export class FacturePrintComponent {
  readonly facture = input.required<FactureClient>();

  readonly typeLabel = computed(() => {
    const labels: Record<string, string> = {
      SITUATION: 'Situation de travaux',
      AVANCE: 'Avance',
      ACOMPTE: 'Acompte',
      DECOMPTE_DEFINITIF: 'Décompte définitif',
      DIVERSE: 'Diverse',
    };
    return labels[this.facture().type] ?? this.facture().type;
  });

  readonly paymentLabel = computed(() => {
    const labels: Record<string, string> = {
      VIREMENT: 'Virement bancaire',
      CHEQUE: 'Chèque',
      EFFET: 'Effet de commerce',
      ESPECES: 'Espèces',
    };
    const mode = this.facture().modePaiement;
    return mode ? labels[mode] ?? mode : 'À convenir';
  });

  formatDate(value?: string): string {
    if (!value) return '—';
    const d = new Date(value);
    // i18n-exempt: A4 print output fixed FR-MA per BTP MA legal req
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('fr-MA');
  }
}
