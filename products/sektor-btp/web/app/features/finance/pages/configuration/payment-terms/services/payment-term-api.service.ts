/**
 * PaymentTerm API Service — Auto-generated from payment-term.entity.json
 * Safe to regenerate — custom logic goes in the facade.
 */

import { Injectable } from '@angular/core';
import { FeatureApiService } from '@lib/anatomy';
import type { PaymentTerm, PaymentTermCreate, PaymentTermUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class PaymentTermsApiService extends FeatureApiService<PaymentTerm, PaymentTermCreate, PaymentTermUpdate> {
  protected override basePath = '/api/v1/payment-terms';
  protected override searchFields = ['code', 'name'];
}
