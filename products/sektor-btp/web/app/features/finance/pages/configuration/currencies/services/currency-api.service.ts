/**
 * Currency API Service — Auto-generated from currency.entity.json
 * Safe to regenerate — custom logic goes in the facade.
 */

import { Injectable } from '@angular/core';
import { FeatureApiService } from '@lib/anatomy';
import type { Currency, CurrencyCreate, CurrencyUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class CurrenciesApiService extends FeatureApiService<Currency, CurrencyCreate, CurrencyUpdate> {
  protected override basePath = '/api/v1/currencies';
  protected override searchFields = ['code', 'name'];
}
