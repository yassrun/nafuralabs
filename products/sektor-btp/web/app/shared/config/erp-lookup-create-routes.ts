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
  items: '/inventory/catalogue/items/new',
  employes: '/rh/employes/new',
  employees: '/rh/employes/new',
  metreurs: '/rh/employes/new',
  currencies: '/finance/configuration/currencies/new',
  deviseCode: '/finance/devises/new',
  unitOfMeasures: '/inventory/units-of-measure/new',
  unitOfMeasure: '/inventory/units-of-measure/new',
  uoMCategories: '/inventory/configuration/uom-categories/new',
  uomCategory: '/inventory/configuration/uom-categories/new',
  itemTypes: '/inventory/configuration/item-types/new',
  itemCategories: '/inventory/configuration/item-categories/new',
  famillesArticle: '/inventory/configuration/familles/new',
  familleArticle: '/inventory/configuration/familles/new',
  familles: '/inventory/configuration/familles/new',
  locations: '/inventory/configuration/depots/new',
  allLocations: '/inventory/configuration/depots/new',
  location: '/inventory/configuration/depots/new',
  depotLocations: '/inventory/configuration/depots/new',
  chantierLocations: '/inventory/configuration/depots/new',
  sourceLocations: '/inventory/configuration/depots/new',
  locationsDepot: '/inventory/configuration/depots/new',
  motifsSortie: '/inventory/configuration/motifs/new',
  motifsRetour: '/inventory/configuration/motifs/new',
  motifsPerte: '/inventory/configuration/motifs/new',
  motifsTransfertChantier: '/inventory/configuration/motifs/new',
  metres: '/etudes/metres/new',
  devis: '/etudes/devis/new',
  factures: '/ventes/factures/new',
  ouvrageCategory: '/etudes/bibliotheque-prix/new',
  conditionPaiementType: '/finance/conditions-paiement/new',
  tauxChangeSource: '/finance/taux-change/new',
  inventoryTxes: '/inventory/mouvements/inventory-txes/new',
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
