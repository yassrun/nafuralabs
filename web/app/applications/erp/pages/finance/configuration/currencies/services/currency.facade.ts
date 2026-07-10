/**
 * Currency Facade — Generated once (wrapper file).
 * Add custom business logic here. This file is never overwritten.
 */

import { Injectable, inject } from '@angular/core';
import { GridFacade } from '@lib/anatomy';
import { CurrenciesApiService } from './currency-api.service';
import type { Currency, CurrencyCreate, CurrencyUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class CurrenciesFacade extends GridFacade<Currency, CurrencyCreate, CurrencyUpdate> {
  protected override api = inject(CurrenciesApiService);

  // ─── Custom Business Actions ──────────────────────────────────────────────
  // Add entity-specific operations below:

  // async archiveItem(id: string): Promise<Currency> {
  //   return this.updateItem(id, { isActive: false } as CurrencyUpdate);
  // }
}
