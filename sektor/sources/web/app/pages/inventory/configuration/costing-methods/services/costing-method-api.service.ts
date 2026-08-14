/**
 * CostingMethod API Service — `/api/v1/costing-methods`
 */

import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { CostingMethodConfig, CostingMethodCreate, CostingMethodUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class CostingMethodsApiService extends FeatureApiService<
  CostingMethodConfig,
  CostingMethodCreate,
  CostingMethodUpdate
> {
  protected override basePath = '/api/v1/costing-methods';
  protected override searchFields = ['code', 'name'];
}
