/**
 * StockBalance Facade — Generated once (wrapper file).
 * Add custom business logic here. This file is never overwritten.
 */

import { Injectable, inject } from '@angular/core';
import { GridFacade } from '@lib/anatomy';
import { StockBalancesApiService } from './stock-balance-api.service';
import type { StockBalance, StockBalanceCreate, StockBalanceUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class StockBalancesFacade extends GridFacade<StockBalance, StockBalanceCreate, StockBalanceUpdate> {
  protected override api = inject(StockBalancesApiService);

  // ─── Custom Business Actions ──────────────────────────────────────────────
  // Add entity-specific operations below:

  // async archiveItem(id: string): Promise<StockBalance> {
  //   return this.updateItem(id, { isActive: false } as StockBalanceUpdate);
  // }
}
