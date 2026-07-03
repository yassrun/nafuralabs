/**
 * ItemPrice API Service — Auto-generated from item-price.entity.json
 * Safe to regenerate — custom logic goes in the facade.
 */

import { Injectable } from '@angular/core';
import { FeatureApiService } from '@lib/anatomy';
import type { ItemPrice, ItemPriceCreate, ItemPriceUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class ItemPricesApiService extends FeatureApiService<ItemPrice, ItemPriceCreate, ItemPriceUpdate> {
  protected override basePath = '/api/v1/item-prices';
}
