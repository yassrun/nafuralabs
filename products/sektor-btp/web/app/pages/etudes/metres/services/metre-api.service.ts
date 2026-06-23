import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type {
  Metre,
  MetreCreate,
  MetreUpdate,
} from '@applications/erp/etudes/models';

@Injectable({ providedIn: 'root' })
export class MetreApiService extends FeatureApiService<Metre, MetreCreate, MetreUpdate> {
  protected override basePath = '/api/v1/etudes/metres';
  protected override searchFields = ['numero', 'projetNom'];
}
