import { Injectable } from '@angular/core';

import { FeatureApiService } from '@platform/lib/anatomy';
import type { RhNomenclature, RhNomenclatureCreate, RhNomenclatureUpdate } from '@app/rh/models';

@Injectable({ providedIn: 'root' })
export class RhPosteApiService extends FeatureApiService<
  RhNomenclature,
  RhNomenclatureCreate,
  RhNomenclatureUpdate
> {
  protected override basePath = '/api/v1/rh/postes';
  protected override searchFields = ['code', 'libelle'];
}

@Injectable({ providedIn: 'root' })
export class RhDepartementApiService extends FeatureApiService<
  RhNomenclature,
  RhNomenclatureCreate,
  RhNomenclatureUpdate
> {
  protected override basePath = '/api/v1/rh/departements';
  protected override searchFields = ['code', 'libelle'];
}
