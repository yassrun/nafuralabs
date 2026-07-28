/**
 * Default listing routes for ERP lookup keys used in select / nf-entity-detail fields.
 * Override per field with `referenceRoute` or `listRoute` on DetailFieldConfig when needed.
 */
export const ERP_LOOKUP_LIST_ROUTES: Readonly<Record<string, string>> = {
  clients: '/ventes/clients',
  chantiers: '/chantiers',
  chantiersLookup: '/chantiers',
  chantiersBudget: '/chantiers',
  fournisseurs: '/achats/fournisseurs',
  fournisseursLookup: '/achats/fournisseurs',
  items: '/stock/catalogue/items',
  employes: '/rh/employes',
  employees: '/rh/employes',
  metreurs: '/rh/employes',
  currencies: '/finance/configuration/currencies',
  deviseCode: '/finance/devises',
  unitOfMeasures: '/stock/units-of-measure',
  unitOfMeasure: '/stock/units-of-measure',
  uoMCategories: '/stock/configuration/uom-categories',
  uomCategory: '/stock/configuration/uom-categories',
  itemTypes: '/stock/configuration/item-types',
  itemCategories: '/stock/configuration/item-categories',
  famillesArticle: '/stock/configuration/familles',
  familleArticle: '/stock/configuration/familles',
  familles: '/stock/configuration/familles',
  locations: '/stock/configuration/depots',
  allLocations: '/stock/configuration/depots',
  location: '/stock/configuration/depots',
  depotLocations: '/stock/configuration/depots',
  chantierLocations: '/stock/configuration/depots',
  sourceLocations: '/stock/configuration/depots',
  locationsDepot: '/stock/configuration/depots',
  motifsSortie: '/stock/configuration/motifs',
  motifsRetour: '/stock/configuration/motifs',
  motifsPerte: '/stock/configuration/motifs',
  motifsTransfertChantier: '/stock/configuration/motifs',
  metres: '/etudes/metres',
  devis: '/etudes/devis',
  factures: '/ventes/factures',
  ouvrageCategory: '/etudes/bibliotheque-prix',
  conditionPaiementType: '/finance/conditions-paiement',
  tauxChangeSource: '/finance/taux-change',
  inventoryTxes: '/stock/mouvements/inventory-txes',
};

export function resolveErpLookupListRoute(
  lookupKey?: string,
  explicitListRoute?: string,
  explicitReferenceRoute?: string
): string | undefined {
  if (explicitReferenceRoute?.trim()) {
    return explicitReferenceRoute.trim();
  }
  if (explicitListRoute?.trim()) {
    return explicitListRoute.trim();
  }
  if (!lookupKey?.trim()) {
    return undefined;
  }
  return ERP_LOOKUP_LIST_ROUTES[lookupKey.trim()];
}
