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
  items: '/inventory/catalogue/items',
  employes: '/rh/employes',
  employees: '/rh/employes',
  metreurs: '/rh/employes',
  currencies: '/finance/configuration/currencies',
  deviseCode: '/finance/devises',
  unitOfMeasures: '/inventory/units-of-measure',
  unitOfMeasure: '/inventory/units-of-measure',
  uoMCategories: '/inventory/configuration/uom-categories',
  uomCategory: '/inventory/configuration/uom-categories',
  itemTypes: '/inventory/configuration/item-types',
  itemCategories: '/inventory/configuration/item-categories',
  famillesArticle: '/inventory/configuration/familles',
  familleArticle: '/inventory/configuration/familles',
  familles: '/inventory/configuration/familles',
  locations: '/inventory/configuration/depots',
  allLocations: '/inventory/configuration/depots',
  location: '/inventory/configuration/depots',
  depotLocations: '/inventory/configuration/depots',
  chantierLocations: '/inventory/configuration/depots',
  sourceLocations: '/inventory/configuration/depots',
  locationsDepot: '/inventory/configuration/depots',
  motifsSortie: '/inventory/configuration/motifs',
  motifsRetour: '/inventory/configuration/motifs',
  motifsPerte: '/inventory/configuration/motifs',
  motifsTransfertChantier: '/inventory/configuration/motifs',
  metres: '/etudes/metres',
  devis: '/etudes/devis',
  factures: '/ventes/factures',
  ouvrageCategory: '/etudes/bibliotheque-prix',
  conditionPaiementType: '/finance/conditions-paiement',
  tauxChangeSource: '/finance/taux-change',
  inventoryTxes: '/inventory/mouvements/inventory-txes',
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
