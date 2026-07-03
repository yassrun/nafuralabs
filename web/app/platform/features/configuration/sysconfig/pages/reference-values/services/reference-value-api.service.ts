/**
 * ReferenceValue API Service — Auto-generated from reference-value.entity.json
 * Safe to regenerate — custom logic goes in the facade.
 */

import { Injectable } from '@angular/core';
import { FeatureApiService } from '@lib/anatomy';
import type { ReferenceValue, ReferenceValueCreate, ReferenceValueUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class ReferenceValuesApiService extends FeatureApiService<ReferenceValue, ReferenceValueCreate, ReferenceValueUpdate> {
  protected override basePath = '/api/v1/reference-values';
  protected override searchFields = ['code', 'name'];
}
