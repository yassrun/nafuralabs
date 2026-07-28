/**
 * ItemType API Service — Auto-generated from item-type.entity.json
 * Safe to regenerate — custom logic goes in the facade.
 */

import { Injectable } from '@angular/core';
import { FeatureApiService } from '@lib/anatomy';
import type { ItemType, ItemTypeCreate, ItemTypeUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class ItemTypesApiService extends FeatureApiService<ItemType, ItemTypeCreate, ItemTypeUpdate> {
  protected override basePath = '/api/v1/item-types';
  protected override searchFields = ['code', 'name'];
}
