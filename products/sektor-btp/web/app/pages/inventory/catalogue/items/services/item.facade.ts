/**
 * Item Facade — Generated once (wrapper file).
 * Add custom business logic here. This file is never overwritten.
 */

import { Injectable, inject } from '@angular/core';
import { GridFacade } from '@lib/anatomy';
import { ItemsApiService } from './item-api.service';
import type { Item, ItemCreate, ItemUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class ItemsFacade extends GridFacade<Item, ItemCreate, ItemUpdate> {
  protected override api = inject(ItemsApiService);

  // ─── Custom Business Actions ──────────────────────────────────────────────
  // Add entity-specific operations below:

  // async archiveItem(id: string): Promise<Item> {
  //   return this.updateItem(id, { isActive: false } as ItemUpdate);
  // }
}
