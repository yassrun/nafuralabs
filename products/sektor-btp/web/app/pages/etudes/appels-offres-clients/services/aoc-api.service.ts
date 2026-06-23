import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type {
  AppelOffreClient,
  AppelOffreClientCreate,
  AppelOffreClientUpdate,
} from '@applications/erp/etudes/models';

@Injectable({ providedIn: 'root' })
export class AOCApiService extends FeatureApiService<
  AppelOffreClient,
  AppelOffreClientCreate,
  AppelOffreClientUpdate
> {
  protected override basePath = '/api/v1/etudes/appels-offres-clients';
  protected override searchFields = ['numero', 'reference', 'objet', 'donneurOrdre'];

  convertToChantier(id: string | number): Promise<{ chantierId: string; aoc: AppelOffreClient }> {
    return this.executeTransition(id, 'convert-to-chantier');
  }
}
