/**
 * ItemType Facade — Generated once (wrapper file).
 * Add custom business logic here. This file is never overwritten.
 */

import { Injectable, inject } from '@angular/core';
import { GridFacade } from '@lib/anatomy';
import { ItemTypesApiService } from './item-type-api.service';
import type { ItemType, ItemTypeCreate, ItemTypeUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class ItemTypesFacade extends GridFacade<ItemType, ItemTypeCreate, ItemTypeUpdate> {
  protected override api = inject(ItemTypesApiService);

  // ─── Custom Business Actions ──────────────────────────────────────────────
  // Add entity-specific operations below:

  // async archiveItem(id: string): Promise<ItemType> {
  //   return this.updateItem(id, { isActive: false } as ItemTypeUpdate);
  // }
}
