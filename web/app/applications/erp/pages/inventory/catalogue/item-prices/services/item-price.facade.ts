/**
 * ItemPrice Facade — Generated once (wrapper file).
 * Add custom business logic here. This file is never overwritten.
 */

import { Injectable, inject } from '@angular/core';
import { GridFacade } from '@lib/anatomy';
import { ItemPricesApiService } from './item-price-api.service';
import type { ItemPrice, ItemPriceCreate, ItemPriceUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class ItemPricesFacade extends GridFacade<ItemPrice, ItemPriceCreate, ItemPriceUpdate> {
  protected override api = inject(ItemPricesApiService);

  // ─── Custom Business Actions ──────────────────────────────────────────────
  // Add entity-specific operations below:

  // async archiveItem(id: string): Promise<ItemPrice> {
  //   return this.updateItem(id, { isActive: false } as ItemPriceUpdate);
  // }
}
