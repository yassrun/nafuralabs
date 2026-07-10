/**
 * Bank API Service — Auto-generated from bank.entity.json
 * Safe to regenerate — custom logic goes in the facade.
 */

import { Injectable } from '@angular/core';
import { FeatureApiService } from '@lib/anatomy';
import type { Bank, BankCreate, BankUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class BanksApiService extends FeatureApiService<Bank, BankCreate, BankUpdate> {
  protected override basePath = '/api/v1/banks';
  protected override searchFields = ['code', 'name', 'swiftCode'];
}
