import { Injectable, inject } from '@angular/core';

import type { LookupContext } from '@lib/anatomy/types';

import { ErpLookupService } from '../../shared/services/erp-lookup.service';
import { itemToArticle, type ItemApiRow } from './item-article.mapper';
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
    const [locationsDepot, chantiersLookup, fournisseursLookup, itemRows] = await Promise.all([
      this.erpLookup.locationDepots(),
      this.erpLookup.chantiers(),
      this.erpLookup.partnersByRole('FOURNISSEUR'),
      this.erpLookup.items(),
    ]);

    const articles = itemRows
      .map((row) => itemToArticle(row.data as unknown as ItemApiRow))
      .filter((a) => a.isActive && (a.articleType === 'MATERIAU' || a.articleType === 'CONSOMMABLE'));

    return {
      locationsDepot: locationsDepot.map((l) => ({ key: l.key, value: l.value })),
      chantiersLookup: chantiersLookup.map((c) => ({
        key: c.key,
        value: c.value,
        data: c.data as Record<string, unknown> | undefined,
      })),
      fournisseursLookup: fournisseursLookup.map((f) => ({
        key: f.key,
        value: f.value,
        data: { ice: (f.data as Record<string, unknown> | undefined)?.['ice'] },
      })),
      phasesLookup: [
        'GO — Fondations',
        'Structure R+3',
        'Second oeuvre',
        'Finitions',
        'VRD',
      ].map((phase) => ({ key: phase, value: phase })),
      articlesAll: articles.map((a) => ({
        key: a.id,
        value: `${a.code} — ${a.name}`,
        data: { uomCode: a.uomCode, uomId: a.uomId, prix: a.prixUnitaire },
      })),
    };
  }
}
