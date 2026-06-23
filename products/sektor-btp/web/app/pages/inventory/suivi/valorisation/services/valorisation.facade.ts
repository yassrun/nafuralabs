import { Injectable, inject, signal } from '@angular/core';

import { StockBalanceEnrichmentService } from '@applications/erp/inventory/services/stock-balance-enrichment.service';
import type { StockBalance, LocationType } from '@applications/erp/inventory/models';
import type {
  ValorisationSnapshot,
  ValorisationKpis,
  FamilleValorisation,
  LocationValorisation,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ValorisationFacade {
  private readonly stockEnrichment = inject(StockBalanceEnrichmentService);

  readonly selectedDate = signal<string>(new Date().toISOString().split('T')[0]);

  async loadSnapshot(): Promise<ValorisationSnapshot> {
    const balances = await this.stockEnrichment.loadEnrichedBalances();
    return this.buildSnapshot(balances, this.selectedDate());
  }

  async refreshSnapshot(): Promise<ValorisationSnapshot> {
    return this.loadSnapshot();
  }

  setDate(date: string): void {
    this.selectedDate.set(date);
  }

  private buildSnapshot(balances: StockBalance[], asOfDate: string): ValorisationSnapshot {
    const withValues = balances.map((b) => ({
      ...b,
      totalValue: b.totalValue ?? (b.unitPrice ?? 0) * b.quantity,
    }));

    const totalStockValue = withValues.reduce((acc, b) => acc + (b.totalValue ?? 0), 0);
    const depotValue = withValues
      .filter((b) => b.locationType !== 'CHANTIER')
      .reduce((acc, b) => acc + (b.totalValue ?? 0), 0);
    const chantierValue = withValues
      .filter((b) => b.locationType === 'CHANTIER')
      .reduce((acc, b) => acc + (b.totalValue ?? 0), 0);

    const kpis: ValorisationKpis = {
      totalStockValue,
      depotValue,
      chantierValue,
      monthlyVariationPercent: 0,
    };

    const byFamille = this.aggregateByFamille(withValues, totalStockValue);
    const byLocation = this.aggregateByLocation(withValues, totalStockValue);

    return {
      asOfDate,
      costingMethod: 'AVCO',
      kpis,
      byFamille,
      byLocation,
    };
  }

  private aggregateByFamille(
    balances: (StockBalance & { totalValue: number })[],
    totalStockValue: number,
  ): FamilleValorisation[] {
    const familleMap = new Map<
      string,
      { name: string; articles: Set<string>; qty: number; value: number }
    >();

    for (const b of balances) {
      const fid = b.familleId ?? 'unknown';
      const fname = b.familleName ?? 'Autre';

      if (!familleMap.has(fid)) {
        familleMap.set(fid, { name: fname, articles: new Set(), qty: 0, value: 0 });
      }

      const entry = familleMap.get(fid)!;
      entry.articles.add(b.articleId);
      entry.qty += b.quantity;
      entry.value += b.totalValue ?? 0;
    }

    const result: FamilleValorisation[] = [];
    for (const [familleId, data] of familleMap.entries()) {
      result.push({
        familleId,
        familleName: data.name,
        articleCount: data.articles.size,
        totalQuantity: data.qty,
        totalValue: data.value,
        percentOfTotal: totalStockValue > 0 ? (data.value / totalStockValue) * 100 : 0,
      });
    }

    return result.sort((a, b) => b.totalValue - a.totalValue);
  }

  private aggregateByLocation(
    balances: (StockBalance & { totalValue: number })[],
    totalStockValue: number,
  ): LocationValorisation[] {
    const locMap = new Map<string, { name: string; type: LocationType; value: number }>();

    for (const b of balances) {
      if (!locMap.has(b.locationId)) {
        locMap.set(b.locationId, {
          name: b.locationName ?? b.locationId,
          type: b.locationType ?? 'DEPOT',
          value: 0,
        });
      }
      locMap.get(b.locationId)!.value += b.totalValue ?? 0;
    }

    const result: LocationValorisation[] = [];
    for (const [locationId, data] of locMap.entries()) {
      result.push({
        locationId,
        locationName: data.name,
        locationType: data.type,
        totalValue: data.value,
        percentOfTotal: totalStockValue > 0 ? (data.value / totalStockValue) * 100 : 0,
      });
    }

    return result.sort((a, b) => b.totalValue - a.totalValue);
  }
}
