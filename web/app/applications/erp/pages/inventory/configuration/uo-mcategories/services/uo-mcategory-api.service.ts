/**
 * UoMCategory API Service — Auto-generated from uo-mcategory.entity.json
 * Safe to regenerate — custom logic goes in the facade.
 */

import { Injectable } from '@angular/core';
import { FeatureApiService } from '@lib/anatomy';
import type { UoMCategory, UoMCategoryCreate, UoMCategoryUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class UoMCategoriesApiService extends FeatureApiService<UoMCategory, UoMCategoryCreate, UoMCategoryUpdate> {
  protected override basePath = '/api/v1/uom-categories';
  protected override searchFields = ['code', 'name'];
}
