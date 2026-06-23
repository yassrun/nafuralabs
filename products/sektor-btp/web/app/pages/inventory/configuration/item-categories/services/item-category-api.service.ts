/**
 * ItemCategory API Service — Auto-generated from item-category.entity.json
 * Safe to regenerate — custom logic goes in the facade.
 */

import { Injectable } from '@angular/core';
import { FeatureApiService } from '@lib/anatomy';
import type { ItemCategory, ItemCategoryCreate, ItemCategoryUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class ItemCategoriesApiService extends FeatureApiService<ItemCategory, ItemCategoryCreate, ItemCategoryUpdate> {
  protected override basePath = '/api/v1/item-categories';
  protected override searchFields = ['code', 'name'];
}
