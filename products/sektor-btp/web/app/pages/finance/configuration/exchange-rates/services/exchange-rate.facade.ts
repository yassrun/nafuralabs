/**
 * ExchangeRate Facade — Generated once (wrapper file).
 * Add custom business logic here. This file is never overwritten.
 */

import { Injectable, inject } from '@angular/core';
import { GridFacade } from '@lib/anatomy';
import { ExchangeRatesApiService } from './exchange-rate-api.service';
import type { ExchangeRate, ExchangeRateCreate, ExchangeRateUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class ExchangeRatesFacade extends GridFacade<ExchangeRate, ExchangeRateCreate, ExchangeRateUpdate> {
  protected override api = inject(ExchangeRatesApiService);

  // ─── Custom Business Actions ──────────────────────────────────────────────
  // Add entity-specific operations below:

  // async archiveItem(id: string): Promise<ExchangeRate> {
  //   return this.updateItem(id, { isActive: false } as ExchangeRateUpdate);
  // }
}
