/**
 * UnitOfMeasure API Service — Auto-generated from unit-of-measure.entity.json
 * Safe to regenerate — custom logic goes in the facade.
 */

import { Injectable } from '@angular/core';
import { FeatureApiService } from '@lib/anatomy';
import type { UnitOfMeasure, UnitOfMeasureCreate, UnitOfMeasureUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class UnitOfMeasuresApiService extends FeatureApiService<UnitOfMeasure, UnitOfMeasureCreate, UnitOfMeasureUpdate> {
  protected override basePath = '/api/v1/units-of-measure';
  protected override searchFields = ['code', 'name'];
}
