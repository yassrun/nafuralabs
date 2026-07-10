/**
 * ExchangeRate API Service — Auto-generated from exchange-rate.entity.json
 * Safe to regenerate — custom logic goes in the facade.
 */

import { Injectable } from '@angular/core';
import { FeatureApiService } from '@lib/anatomy';
import type { ExchangeRate, ExchangeRateCreate, ExchangeRateUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class ExchangeRatesApiService extends FeatureApiService<ExchangeRate, ExchangeRateCreate, ExchangeRateUpdate> {
  protected override basePath = '/api/v1/exchange-rates';
  protected override searchFields = ['source'];
}
