import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import {
  MagasinChantierApiService,
  type ApiMagasinChantier,
  type ApiMagasinMouvement,
} from '@applications/erp/inventory/services/magasin-chantier-api.service';
import type { Location, StockBalance } from '@applications/erp/inventory/models';

@Component({
  selector: 'app-magasin-chantier-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MadCurrencyPipe],
  template: `
    @if (location(); as loc) {
      <section class="page">
        <header>
          <p class="kicker">Magasin chantier</p>
          <h1>{{ loc.name }}</h1>
          <p class="meta">{{ loc.code }}</p>
        </header>
        <div class="actions">
          <a class="btn" [routerLink]="['/inventory/mouvements/sorties']" [queryParams]="sortieQuery()">
            Bon de matières (sortie)
          </a>
          <a class="btn ghost" [routerLink]="['/inventory/mouvements/transferts']">Transfert vers chantier</a>
        </div>
        <table>
          <thead>
            <tr>
              <th>Article</th>
              <th>Qté</th>
              <th>Valorisation</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.id) {
              <tr>
                <td>{{ row.articleCode }} — {{ row.articleName }}</td>
                <td>{{ row.quantity | number: '1.0-2' }}</td>
                <td>{{ rowLineValue(row) | mad }}</td>
              </tr>
            }
          </tbody>
        </table>
        @if (totalValorisation() !== null) {
          <p class="total">Total valorisation : {{ totalValorisation() | mad }}</p>
        }
        @if (mouvements().length) {
          <h2 class="sub">Derniers mouvements</h2>
          <table class="mvt">
            <thead>
              <tr>
                <th>N°</th>
                <th>Type</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Qté</th>
              </tr>
            </thead>
            <tbody>
              @for (m of mouvements(); track m.id) {
                <tr>
                  <td>{{ m.txNumber }}</td>
                  <td>{{ m.txType }}</td>
                  <td>{{ m.txDate }}</td>
                  <td>{{ m.status }}</td>
                  <td>{{ m.totalQuantity | number: '1.0-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
        <p class="foot">
          Valorisation PMP — liaison budget via sorties validées (M-STK-03 / M-STK-04).
        </p>
      </section>
    } @else if (!loading()) {
      <p class="page">Magasin chantier introuvable pour ce paramètre.</p>
    }
  `,
  styles: [
    `
      .page {
        padding: 1.25rem;
        max-width: 960px;
      }
      .kicker {
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-size: 0.75rem;
        color: var(--nf-color-text-secondary);
        margin: 0;
      }
      h1 {
        margin: 0.25rem 0;
      }
      .meta {
        color: var(--nf-color-text-secondary);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 1rem 0;
      }
      .btn {
        display: inline-block;
        padding: 0.5rem 0.9rem;
        border-radius: 999px;
        background: var(--nf-color-teal-800, var(--nf-color-primary-800));
        color: var(--nf-color-surface);
        text-decoration: none;
        font-weight: 600;
      }
      .btn.ghost {
        background: var(--nf-color-surface);
        color: var(--nf-color-teal-800, var(--nf-color-primary-800));
        border: 1px solid var(--nf-color-border);
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        padding: 0.65rem 0.5rem;
        border-bottom: 1px solid var(--nf-color-border);
        text-align: left;
      }
      .total {
        margin-top: 0.75rem;
        font-weight: 600;
      }
      .sub {
        margin: 1.5rem 0 0.5rem;
        font-size: 1rem;
      }
      .foot {
        margin-top: 1rem;
        font-size: 0.85rem;
        color: var(--nf-color-text-secondary);
      }
    `,
  ],
})
export class MagasinChantierPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(MagasinChantierApiService);

  readonly location = signal<Location | undefined>(undefined);
  readonly rows = signal<StockBalance[]>([]);
  readonly mouvements = signal<ApiMagasinMouvement[]>([]);
  readonly totalValorisation = signal<number | null>(null);
  readonly sortieQuery = signal<Record<string, string>>({});
  readonly loading = signal(true);

  ngOnInit(): void {
    void this.hydrate();
  }

  private async hydrate(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('chantierId') ?? '';
    this.loading.set(true);
    try {
      const data = await this.api.getMagasin(id);
      this.applyMagasin(data);
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 404) {
        this.location.set(undefined);
        this.rows.set([]);
        this.mouvements.set([]);
        this.totalValorisation.set(null);
        this.sortieQuery.set({});
      } else {
        throw err;
      }
    } finally {
      this.loading.set(false);
    }
  }

  private applyMagasin(data: ApiMagasinChantier): void {
    this.location.set({
      id: data.depotChantierId,
      code: data.depotCode ?? data.chantierId,
      name: data.chantierLabel,
      type: 'CHANTIER',
      isActive: true,
      budgetChantierId: data.chantierId,
    });
    this.sortieQuery.set({ chantierBudgetId: data.chantierId });
    this.totalValorisation.set(Number(data.totalValorisation));
    this.mouvements.set(data.derniersMouvements ?? []);
    this.rows.set(
      (data.stockArticles ?? []).map((a) => {
        const qte = Number(a.qte);
        return {
          id: `${a.itemId}-${data.depotChantierId}`,
          articleId: a.itemId,
          articleCode: a.code ?? '',
          articleName: a.label,
          locationId: data.depotChantierId,
          quantity: qte,
          reservedQuantity: 0,
          availableQuantity: qte,
          unitPrice: Number(a.unitPrice),
        };
      }),
    );
  }

  rowLineValue(row: StockBalance): number {
    const u = row.unitPrice ?? 0;
    return Math.round(row.quantity * u * 100) / 100;
  }
}
