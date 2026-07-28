/**
 * Default "create" routes for ERP lookup keys used in select / nf-entity-detail fields.
 * Override per field with `createRoute` on DetailFieldConfig when needed.
 */
export const ERP_LOOKUP_CREATE_ROUTES: Readonly<Record<string, string>> = {
  clients: '/ventes/clients/new',
  chantiers: '/chantiers/new',
  chantiersLookup: '/chantiers/new',
  chantiersBudget: '/chantiers/new',
  fournisseurs: '/achats/fournisseurs/new',
  fournisseursLookup: '/achats/fournisseurs/new',
  items: '/stock/catalogue/items/new',
  employes: '/rh/employes/new',
  employees: '/rh/employes/new',
  metreurs: '/rh/employes/new',
  currencies: '/finance/configuration/currencies/new',
  deviseCode: '/finance/devises/new',
  unitOfMeasures: '/stock/units-of-measure/new',
  unitOfMeasure: '/stock/units-of-measure/new',
  uoMCategories: '/stock/configuration/uom-categories/new',
  uomCategory: '/stock/configuration/uom-categories/new',
  itemTypes: '/stock/configuration/item-types/new',
  itemCategories: '/stock/configuration/item-categories/new',
  famillesArticle: '/stock/configuration/familles/new',
  familleArticle: '/stock/configuration/familles/new',
  familles: '/stock/configuration/familles/new',
  locations: '/stock/configuration/depots/new',
  allLocations: '/stock/configuration/depots/new',
  location: '/stock/configuration/depots/new',
  depotLocations: '/stock/configuration/depots/new',
  chantierLocations: '/stock/configuration/depots/new',
  sourceLocations: '/stock/configuration/depots/new',
  locationsDepot: '/stock/configuration/depots/new',
  motifsSortie: '/stock/configuration/motifs/new',
  motifsRetour: '/stock/configuration/motifs/new',
  motifsPerte: '/stock/configuration/motifs/new',
  motifsTransfertChantier: '/stock/configuration/motifs/new',
  metres: '/etudes/metres/new',
  devis: '/etudes/devis/new',
  factures: '/ventes/factures/new',
  ouvrageCategory: '/etudes/bibliotheque-prix/new',
  conditionPaiementType: '/finance/conditions-paiement/new',
  tauxChangeSource: '/finance/taux-change/new',
  inventoryTxes: '/stock/mouvements/inventory-txes/new',
};

export function resolveErpLookupCreateRoute(
  lookupKey?: string,
  explicitCreateRoute?: string
): string | undefined {
  if (explicitCreateRoute?.trim()) {
    return explicitCreateRoute.trim();
  }
  if (!lookupKey?.trim()) {
    return undefined;
  }
  return ERP_LOOKUP_CREATE_ROUTES[lookupKey.trim()];
}
