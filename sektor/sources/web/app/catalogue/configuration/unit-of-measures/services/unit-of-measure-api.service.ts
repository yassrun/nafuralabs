/**
 * UnitOfMeasure API Service
 */

import { Injectable } from '@angular/core';
import { FeatureApiService } from '@platform/lib/anatomy';
import type {
  UnitOfMeasure,
  UnitOfMeasureCreate,
  UnitOfMeasureUpdate,
  UomConversionRequest,
  UomConversionResult,
} from '../models';

@Injectable({ providedIn: 'root' })
export class UnitOfMeasuresApiService extends FeatureApiService<
  UnitOfMeasure,
  UnitOfMeasureCreate,
  UnitOfMeasureUpdate
> {
  protected override basePath = '/api/v1/units-of-measure';
  protected override searchFields = ['code', 'name'];

  convert(request: UomConversionRequest): Promise<UomConversionResult> {
    return this.post<UomConversionResult>(`${this.basePath}/convert`, request);
  }
}
