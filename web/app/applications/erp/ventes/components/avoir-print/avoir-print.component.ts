import { CommonModule } from '@angular/common';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { Avoir } from '../../models';

/**
 * Template imprimable d'un avoir client conforme exigences fiscales Maroc.
 * Reprend les mentions obligatoires : raison sociale + ICE/RC/IF, n° avoir,
 * référence facture origine, motif, lignes, HT/TVA/TTC, mention "MAD".
 */
@Component({
  selector: 'app-avoir-print',
  standalone: true,
  imports: [CommonModule, MadCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="ap" data-print-area="avoir">
      <header class="ap__header">
        <div class="ap__company">
          <h1>SEYRURA BTP SARL</h1>
          <p>47 Boulevard Zerktouni, Casablanca 20100</p>
          <ul class="ap__legal">
            <li>ICE : 002847593000087</li>
            <li>RC : 715869 — Casablanca</li>
            <li>IF : 40297583</li>
            <li>Patente : 35628471</li>
          </ul>
        </div>
        <div class="ap__meta">
          <h2>AVOIR</h2>
          <table>
            <tr>
              <th>N°</th>
              <td>{{ avoir().numero }}</td>
            </tr>
            <tr>
              <th>Date</th>
              <td>{{ formatDate(avoir().dateEmission) }}</td>
            </tr>
            <tr>
              <th>Facture origine</th>
              <td>{{ avoir().factureOriginaleNumero }}</td>
            </tr>
          </table>
        </div>
      </header>

      <section class="ap__client">
        <h3>Au profit de</h3>
        <p class="ap__client-name">{{ avoir().clientName }}</p>
      </section>

      <section class="ap__motif">
        <h4>Motif de l'avoir</h4>
        <p>{{ avoir().motif }}</p>
      </section>

      <table class="ap__lines">
        <thead>
          <tr>
            <th>Désignation</th>
            <th class="num">Total HT</th>
          </tr>
        </thead>
        <tbody>
          @for (l of avoir().lignes; track l.id) {
            <tr>
              <td>{{ l.designation }}</td>
              <td class="num">{{ l.totalHt | mad:2 }}</td>
            </tr>
          }
        </tbody>
      </table>

      <section class="ap__totaux">
        <div class="ap__totaux-grid">
          <div>
            <span>Total HT</span>
            <strong>{{ avoir().totalHt | mad:2 }}</strong>
          </div>
          <div>
            <span>TVA {{ avoir().tvaTaux }} %</span>
            <strong>{{ avoir().totalTva | mad:2 }}</strong>
          </div>
          <div class="ap__totaux-ttc">
            <span>Total TTC</span>
            <strong>{{ avoir().totalTtc | mad:2 }}</strong>
          </div>
        </div>
        <p class="ap__mention">
          Avoir établi en MAD pour un montant de
          <strong>{{ avoir().totalTtc | mad:2 }}</strong>.
        </p>
      </section>

      <footer class="ap__footer">
        <div class="ap__cachet"><span>Cachet et signature</span></div>
      </footer>
    </article>
  `,
  styles: [
    `
      .ap {
        background: var(--nf-color-surface);
        color: var(--nf-text-primary);
        padding: 24px;
        max-width: 880px;
        margin: 0 auto;
        font-family: 'Inter', 'Segoe UI', sans-serif;
        font-size: 12px;
      }
      .ap__header {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        border-bottom: 2px solid var(--nf-text-primary);
        padding-bottom: 12px;
        margin-bottom: 16px;
      }
      .ap__company h1 {
        margin: 0;
        font-size: 20px;
        color: var(--nf-color-warning-700);
      }
      .ap__company p {
        margin: 2px 0;
        font-size: 11px;
      }
      .ap__legal {
        list-style: none;
        padding: 0;
        margin: 6px 0 0;
        font-size: 11px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 12px;
      }
      .ap__meta {
        text-align: right;
        min-width: 240px;
      }
      .ap__meta h2 {
        margin: 0 0 8px;
        font-size: 22px;
        color: var(--nf-color-warning-700);
        letter-spacing: 0.08em;
      }
      .ap__meta table {
        width: 100%;
        font-size: 11px;
      }
      .ap__meta th {
        text-align: left;
        font-weight: 500;
        color: var(--nf-color-text-secondary);
      }
      .ap__meta td {
        text-align: right;
        font-weight: 600;
      }
      .ap__client {
        background: var(--nf-color-bg-subtle);
        border: 1px solid var(--nf-color-border);
        border-radius: 6px;
        padding: 10px 12px;
        margin-bottom: 12px;
      }
      .ap__client h3 {
        margin: 0;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--nf-color-text-secondary);
      }
      .ap__client-name {
        margin: 4px 0 0;
        font-weight: 700;
        font-size: 14px;
      }
      .ap__motif {
        background: var(--nf-color-warning-100);
        border: 1px solid var(--nf-color-warning-300);
        border-radius: 6px;
        padding: 10px 12px;
        margin-bottom: 16px;
      }
      .ap__motif h4 {
        margin: 0 0 4px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--nf-color-warning-700);
      }
      .ap__motif p {
        margin: 0;
        font-size: 12px;
      }
      .ap__lines {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 12px;
      }
      .ap__lines th,
      .ap__lines td {
        padding: 8px 10px;
        border-bottom: 1px solid var(--nf-color-border);
        font-size: 11px;
      }
      .ap__lines th {
        background: var(--nf-color-bg-muted);
        text-align: left;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--nf-color-text-secondary);
      }
      .ap__lines td.num,
      .ap__lines th.num {
        text-align: right;
        white-space: nowrap;
      }
      .ap__totaux {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
      }
      .ap__totaux-grid {
        width: min(320px, 100%);
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .ap__totaux-grid > div {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 12px;
        padding: 4px 0;
      }
      .ap__totaux-ttc {
        background: var(--nf-color-warning-700);
        color: var(--nf-color-surface);
        padding: 8px 10px;
        border-radius: 6px;
        margin-top: 6px;
        font-weight: 700;
      }
      .ap__totaux-ttc strong {
        color: var(--nf-color-surface);
      }
      .ap__mention {
        font-size: 11px;
        color: var(--nf-color-text-secondary);
        font-style: italic;
        text-align: right;
      }
      .ap__footer {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
      }
      .ap__cachet {
        border: 1px dashed var(--nf-color-text-muted);
        width: 220px;
        height: 80px;
        border-radius: 8px;
        display: flex;
        align-items: end;
        justify-content: center;
        padding: 6px;
        color: var(--nf-color-text-muted);
        font-size: 10px;
      }
      @media print {
        .ap {
          padding: 0;
        }
      }
    `,
  ],
})
export class AvoirPrintComponent {
  readonly avoir = input.required<Avoir>();

  formatDate(value?: string): string {
    if (!value) return '—';
    const d = new Date(value);
    // i18n-exempt: A4 print output fixed FR-MA per BTP MA legal req
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('fr-MA');
  }
}
