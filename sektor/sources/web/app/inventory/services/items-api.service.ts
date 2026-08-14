import { Injectable } from '@angular/core';
import { FeatureApiService } from '@lib/anatomy';
import type { Item, ItemCreate, ItemUpdate } from '../../pages/inventory/catalogue/items/models';

/**
 * Shared Items API — moved out of dead catalogue/items tree (stock Lot 6).
 */
@Injectable({ providedIn: 'root' })
export class ItemsApiService extends FeatureApiService<Item, ItemCreate, ItemUpdate> {
  protected override basePath = '/api/v1/items';
  protected override searchFields = ['code', 'name', 'sku'];
}
