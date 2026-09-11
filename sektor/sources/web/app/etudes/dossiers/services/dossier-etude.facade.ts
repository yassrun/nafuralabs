import { Injectable, inject } from '@angular/core';

import { GridFacade } from '@platform/lib/anatomy';
import type {
  DossierEtude,
  DossierEtudeCreate,
  DossierEtudeUpdate,
} from '@app/etudes/models';

import { DossierEtudeApiService } from './dossier-etude-api.service';

@Injectable({ providedIn: 'root' })
export class DossierEtudeFacade extends GridFacade<
  DossierEtude,
  DossierEtudeCreate,
  DossierEtudeUpdate
> {
  protected override api = inject(DossierEtudeApiService);

  override async loadLookups(): Promise<void> {
    try {
      const list = await this.api.listIngenieurs();
      this._lookups.set({
        ingenieurs: list.map((c) => ({
          key: c.userId,
          value: (c.displayName || c.email || c.userId).trim(),
        })),
      });
    } catch {
      this._lookups.set({ ingenieurs: [] });
    }
    this._lookupsLoaded.set(true);
  }
}
