import { Injectable, inject } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type {
  DossierEtude,
  DossierEtudeCreate,
  DossierEtudeUpdate,
} from '@app/features/etudes/models';

import { DossierEtudeApiService } from './dossier-etude-api.service';

@Injectable({ providedIn: 'root' })
export class DossierEtudeFacade extends GridFacade<
  DossierEtude,
  DossierEtudeCreate,
  DossierEtudeUpdate
> {
  protected override api = inject(DossierEtudeApiService);
}
