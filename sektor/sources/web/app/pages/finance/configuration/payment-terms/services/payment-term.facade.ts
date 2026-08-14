/**
 * PaymentTerm Facade — Generated once (wrapper file).
 * Add custom business logic here. This file is never overwritten.
 */

import { Injectable, inject } from '@angular/core';
import { GridFacade } from '@lib/anatomy';
import { PaymentTermsApiService } from './payment-term-api.service';
import type { PaymentTerm, PaymentTermCreate, PaymentTermUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class PaymentTermsFacade extends GridFacade<PaymentTerm, PaymentTermCreate, PaymentTermUpdate> {
  protected override api = inject(PaymentTermsApiService);

  // ─── Custom Business Actions ──────────────────────────────────────────────
  // Add entity-specific operations below:

  // async archiveItem(id: string): Promise<PaymentTerm> {
  //   return this.updateItem(id, { isActive: false } as PaymentTermUpdate);
  // }
}
