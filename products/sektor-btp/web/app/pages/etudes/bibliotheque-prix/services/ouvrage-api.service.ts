import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type {
  Ouvrage,
  OuvrageCreate,
  OuvrageUpdate,
} from '@applications/erp/etudes/models';

@Injectable({ providedIn: 'root' })
export class OuvrageApiService extends FeatureApiService<Ouvrage, OuvrageCreate, OuvrageUpdate> {
  protected override basePath = '/api/v1/etudes/ouvrages';
  protected override searchFields = ['code', 'designation'];
}
