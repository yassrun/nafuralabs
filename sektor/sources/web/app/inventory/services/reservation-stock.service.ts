import { Injectable, computed, inject, signal } from '@angular/core';

import type { ReservationStock, ReservationStockStatus } from '../models';
import {
  StockReservationsApiService,
  apiToReservationStock,
  reservationStockToCreateBody,
} from './stock-reservations-api.service';

@Injectable({ providedIn: 'root' })
export class ReservationStockService {
  private readonly api = inject(StockReservationsApiService);

  private readonly reservations = signal<ReservationStock[]>([]);
  private loaded = false;

  readonly all = computed(() => this.reservations());

  async refresh(): Promise<void> {
    const rows = await this.api.list();
    this.reservations.set(rows.map(apiToReservationStock));
    this.loaded = true;
  }

  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      await this.refresh();
    }
  }

  listForChantier(chantierId: string): ReservationStock[] {
    return this.all().filter((r) => r.chantierId === chantierId);
  }

  listForArticle(articleId: string): ReservationStock[] {
    return this.all().filter((r) => r.articleId === articleId);
  }

  activeReservedQty(articleId: string, chantierId: string): number {
    return this.all()
      .filter((r) => r.articleId === articleId && r.chantierId === chantierId && r.status === 'ACTIVE')
      .reduce((s, r) => s + r.qte, 0);
  }

  async create(input: Omit<ReservationStock, 'id' | 'dateCreation' | 'status'>): Promise<ReservationStock> {
    const row = await this.api.create(reservationStockToCreateBody(input));
    const mapped = apiToReservationStock(row);
    this.reservations.update((rows) => [...rows, mapped]);
    return mapped;
  }

  async setStatus(id: string, status: ReservationStockStatus): Promise<void> {
    if (status === 'ANNULEE') {
      await this.api.release(id);
    } else {
      throw new Error(`Status ${status} must be set via dedicated API operations`);
    }
    await this.refresh();
  }

  /**
   * Consomme les réservations actives les plus anciennes (FIFO) pour une sortie chantier.
   * Backend also applies FIFO on SORTIE validate — this keeps UI caches in sync when called locally.
   */
  async consumeFifoForChantier(
    chantierBudgetId: string,
    lines: Array<{ articleId?: string; qte: number }>,
  ): Promise<void> {
    await this.ensureLoaded();
    const next = this.reservations().map((r) => ({ ...r }));
    for (const line of lines) {
      if (!line.articleId || line.qte <= 0) continue;
      let remaining = line.qte;
      while (remaining > 0) {
        const idx = next
          .map((r, i) => ({ r, i }))
          .filter(
            ({ r }) =>
              r.chantierId === chantierBudgetId &&
              r.articleId === line.articleId &&
              r.status === 'ACTIVE',
          )
          .sort((a, b) => a.r.dateCreation.localeCompare(b.r.dateCreation))[0]?.i;
        if (idx === undefined) break;
        const r = next[idx];
        const take = Math.min(remaining, r.qte);
        remaining -= take;
        const q = r.qte - take;
        next[idx] = q <= 0 ? { ...r, qte: 0, status: 'CONSOMMEE' } : { ...r, qte: q };
      }
    }
    this.reservations.set(next);
    await this.refresh();
  }
}
