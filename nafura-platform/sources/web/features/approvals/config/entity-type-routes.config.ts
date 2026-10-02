/**
 * Maps entityType to detail route prefix (without id).
 * Used to build "View entity" links from approvals dashboard.
 * Add entries per application entity types.
 */
export const ENTITY_TYPE_ROUTE_PREFIX: Record<string, string> = {
  item: '/directory/operations/items',
  'item-type': '/directory/configuration/item-types',
  'item-category': '/directory/configuration/item-categories',
  location: '/directory/operations/locations',
  'inventory-tx': '/inventory/transactions/inventory-txs',
  'stock-balance': '/inventory/transactions/stock-balances',
  currency: '/finance/configuration/currencies',
  'exchange-rate': '/finance/configuration/exchange-rates',
  'payment-term': '/finance/configuration/payment-terms',
};

/** Record routes declared by business contexts: entity type → `/route/{id}`. */
const DECLARED_ROUTES = new Map<string, string>();

export function registerEntityRoutes(routes: Readonly<Record<string, string>>): void {
  for (const [entityType, route] of Object.entries(routes)) DECLARED_ROUTES.set(entityType, route);
}

export function getEntityDetailRoute(entityType: string, entityId: string): string[] {
  const declared = DECLARED_ROUTES.get(entityType);
  if (declared) {
    return [declared.replace('{id}', entityId)];
  }
  const prefix = ENTITY_TYPE_ROUTE_PREFIX[entityType];
  if (prefix) {
    return [prefix, entityId];
  }
  return [];
}
