import { Injectable, inject } from '@angular/core';

import type { LookupContext } from '@platform/lib/anatomy/types';

import { LocationsApiService } from '../configuration/depots/services/location-api.service';
import { ErpLookupService } from '../../socle/shared/services/erp-lookup.service';
import type { Location } from '../models';

/**
 * Shared HTTP-backed lookups for inventory movement screens.
 */
@Injectable({ providedIn: 'root' })
export class InventoryLookupsService {
  private readonly erpLookup = inject(ErpLookupService);
  private readonly locationsApi = inject(LocationsApiService);

  /** Typeahead-only — no collection dump (AC-2). Use {@link resolveLocation} for a known id. */
  async loadLocations(search?: string): Promise<Location[]> {
    const rows = await this.erpLookup.locations(search);
    return rows
      .map((row) => row.data as Location | undefined)
      .filter((l): l is Location => !!l);
  }

  /** Single location by id — for display enrichment, not a collection dump. */
  async resolveLocation(id?: string): Promise<Location | undefined> {
    const trimmed = id?.trim();
    if (!trimmed) return undefined;
    try {
      return await this.locationsApi.getById(trimmed);
    } catch {
      return undefined;
    }
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
