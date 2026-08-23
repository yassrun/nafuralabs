import type { LookupSearchFn } from '@platform/lib/anatomy';
import type { LookupItem } from '@platform/lib/anatomy/types';

import {
  ErpLookupService,
  lookupSelectOptions,
  partnerSelectOptions,
} from './erp-lookup.service';

/**
 * Typeahead map for every {@link ERP_LOOKUP_LIST_ROUTES} key except `items` (picker, AC-13).
 * Queries shorter than 2 characters resolve to [] — no collection GET.
 */
export function buildErpLookupSearchers(
  erp: ErpLookupService,
): Readonly<Record<string, LookupSearchFn>> {
  const typeahead = (
    load: (q: string) => Promise<LookupItem[]>,
    map: (items: LookupItem[]) => Array<{ value: string; label: string }> = lookupSelectOptions,
  ): LookupSearchFn => {
    return (q) => {
      const term = q.trim();
      if (term.length < 2) return Promise.resolve([]);
      return load(term).then(map);
    };
  };

  const clients = typeahead((q) => erp.partnersByRole('CLIENT', q), partnerSelectOptions);
  const fournisseurs = typeahead(
    (q) => erp.partnersByRole('FOURNISSEUR', q),
    partnerSelectOptions,
  );
  const chantiers = typeahead((q) => erp.chantiers(q));
  const employes = typeahead((q) => erp.employes('ACTIF', q));
  const locations = typeahead((q) => erp.locations(q));
  const depotLocations = typeahead((q) =>
    erp.locations(q).then((items) =>
      items.filter((item) => {
        const type = (item.data as Record<string, unknown> | undefined)?.['type'];
        return typeof type === 'string' && ['DEPOT', 'ENTREPOT', 'TRANSIT', 'VIRTUEL'].includes(type);
      }),
    ),
  );
  const currencies = typeahead((q) => erp.currencies(q));
  const devis = typeahead((q) => erp.devis(q));
  const factures = typeahead((q) => erp.factures(q));
  const uoms = typeahead((q) => erp.uoms(q));
  const uomCategories = typeahead((q) => erp.uomCategories(q));
  const itemCategories = typeahead((q) => erp.itemCategories(q));
  const motifs = typeahead((q) => erp.motifs(q));
  const ouvrages = typeahead((q) => erp.ouvrages(q));
  const inventoryTxes = typeahead((q) => erp.inventoryTxes(q));

  return {
    clients,
    fournisseurs,
    fournisseursLookup: fournisseurs,
    chantiers,
    chantiersLookup: chantiers,
    chantiersBudget: chantiers,
    employes,
    employees: employes,
    locations,
    allLocations: locations,
    location: locations,
    depotLocations,
    chantierLocations: locations,
    sourceLocations: locations,
    locationsDepot: depotLocations,
    currencies,
    deviseCode: currencies,
    unitOfMeasures: uoms,
    unitOfMeasure: uoms,
    uoMCategories: uomCategories,
    uomCategory: uomCategories,
    itemCategories,
    famillesArticle: itemCategories,
    familleArticle: itemCategories,
    familles: itemCategories,
    motifsSortie: motifs,
    motifsRetour: motifs,
    motifsPerte: motifs,
    motifsTransfertChantier: motifs,
    devis,
    factures,
    ouvrageCategory: ouvrages,
    conditionPaiementType: typeahead((q) => erp.paymentTerms(q)),
    tauxChangeSource: currencies,
    inventoryTxes,
  };
}
