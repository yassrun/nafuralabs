/**
 * InventoryTxLine Facade — Generated once (wrapper file).
 * Add custom business logic here. This file is never overwritten.
 */

import { Injectable, inject } from '@angular/core';
import { GridFacade } from '@lib/anatomy';
import { InventoryTxLinesApiService } from './inventory-tx-line-api.service';
import type { InventoryTxLine, InventoryTxLineCreate, InventoryTxLineUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class InventoryTxLinesFacade extends GridFacade<InventoryTxLine, InventoryTxLineCreate, InventoryTxLineUpdate> {
  protected override api = inject(InventoryTxLinesApiService);

  // ─── Custom Business Actions ──────────────────────────────────────────────
  // Add entity-specific operations below:

  // async archiveItem(id: string): Promise<InventoryTxLine> {
  //   return this.updateItem(id, { isActive: false } as InventoryTxLineUpdate);
  // }
}
