/**
 * CodeList API Service — Auto-generated from code-list.entity.json
 * Safe to regenerate — custom logic goes in the facade.
 */

import { Injectable } from '@angular/core';
import { FeatureApiService } from '@lib/anatomy';
import type { CodeList, CodeListCreate, CodeListUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class CodeListsApiService extends FeatureApiService<CodeList, CodeListCreate, CodeListUpdate> {
  protected override basePath = '/api/v1/code-lists';
  protected override searchFields = ['code', 'name'];
}
