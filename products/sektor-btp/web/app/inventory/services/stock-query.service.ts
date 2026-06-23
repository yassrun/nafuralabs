import { Injectable, inject } from '@angular/core';

import type { StockBalance as ApiStockBalance } from '../../pages/inventory/suivi/stock-balances/models';
import { StockBalancesApiService } from '../../pages/inventory/suivi/stock-balances/services/stock-balance-api.service';
import type { StockBalance } from '../models';

/** Full list query for stock snapshots (filters applied client-side where needed). */
const STOCK_LIST_QUERY = { page: 0, pageSize: 5000 } as const;

export function mapStockBalanceApiToUi(api: ApiStockBalance): StockBalance {
  const reserved = api.reservedQuantity ?? 0;
  const available =
    api.availableQuantity !== undefined ? api.availableQuantity : Math.max(api.quantity - reserved, 0);
  return {
    id: api.id,
    articleId: api.itemId,
    locationId: api.warehouseId,
    quantity: api.quantity,
    reservedQuantity: reserved,
    availableQuantity: available,
    lastCountDate: api.lastCountDate,
  };
}

/**
 * Cached stock balances from {@link StockBalancesApiService}, with API field mapping:
 * `warehouseId` → `locationId`, `itemId` → `articleId`.
 */
@Injectable({ providedIn: 'root' })
export class StockQueryService {
  private readonly api = inject(StockBalancesApiService);
  private balances: StockBalance[] | null = null;

  async loadAllBalances(): Promise<void> {
    const res = await this.api.getAll(STOCK_LIST_QUERY);
    this.balances = res.items.map(mapStockBalanceApiToUi);
  }

  getByWarehouse(warehouseId: string): StockBalance[] {
    return (this.balances ?? []).filter((b) => b.locationId === warehouseId);
  }

  /** Loads balances for one location/warehouse from the API (no cache required). */
  async getBalancesByLocation(locationId: string): Promise<StockBalance[]> {
    const res = await this.api.listFiltered({ warehouseId: locationId, pageSize: 500 });
    return res.items.map(mapStockBalanceApiToUi);
  }

  getAvailableQuantity(itemId: string, warehouseId: string): number {
    const row = (this.balances ?? []).find(
      (b) => b.articleId === itemId && b.locationId === warehouseId,
    );
    return row?.availableQuantity ?? 0;
  }

  /** Snapshot after {@link loadAllBalances} — empty until loaded. */
  getCachedBalances(): StockBalance[] {
    return this.balances ?? [];
  }

  async aggregateByItems(itemIds: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (!itemIds.length) return map;
    const rows = await this.api.aggregateByItemIds(itemIds);
    for (const row of rows) {
      map.set(row.itemId, row.totalQuantity);
    }
    return map;
  }
}
