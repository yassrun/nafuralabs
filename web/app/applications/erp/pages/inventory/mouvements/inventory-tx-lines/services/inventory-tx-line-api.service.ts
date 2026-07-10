/**
 * InventoryTxLine API Service — Auto-generated from inventory-tx-line.entity.json
 * Safe to regenerate — custom logic goes in the facade.
 */

import { Injectable } from '@angular/core';
import { FeatureApiService } from '@lib/anatomy';
import type { InventoryTxLine, InventoryTxLineCreate, InventoryTxLineUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class InventoryTxLinesApiService extends FeatureApiService<InventoryTxLine, InventoryTxLineCreate, InventoryTxLineUpdate> {
  protected override basePath = '/api/v1/inventory-tx-lines';
}
