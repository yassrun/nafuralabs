import { Injectable, inject } from '@angular/core';

import type { LookupContext } from '@platform/lib/anatomy/types';

import { ErpLookupService } from '../../socle/shared/services/erp-lookup.service';
import type { Location } from '../models';

/**
 * Shared HTTP-backed lookups for inventory movement screens.
 */
@Injectable({ providedIn: 'root' })
export class InventoryLookupsService {
  private readonly erpLookup = inject(ErpLookupService);

  async loadLocations(): Promise<Location[]> {
    const rows = await this.erpLookup.locations();
    return rows
      .map((row) => row.data as Location | undefined)
      .filter((l): l is Location => !!l);
  }

  async buildReceptionLookups(): Promise<LookupContext> {
    return {
      locationsDepot: [],
      chantiersLookup: [],
      fournisseursLookup: [],
      phasesLookup: [
        'GO — Fondations',
        'Structure R+3',
        'Second oeuvre',
        'Finitions',
        'VRD',
      ].map((phase) => ({ key: phase, value: phase })),
      articlesAll: [],
    };
  }
}
