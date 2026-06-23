/**
 * Item API Service — Auto-generated from item.entity.json
 * Safe to regenerate — custom logic goes in the facade.
 */

import { Injectable } from '@angular/core';
import { FeatureApiService } from '@lib/anatomy';
import type { Item, ItemCreate, ItemUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class ItemsApiService extends FeatureApiService<Item, ItemCreate, ItemUpdate> {
  protected override basePath = '/api/v1/items';
  protected override searchFields = ['code', 'name', 'sku'];
}
