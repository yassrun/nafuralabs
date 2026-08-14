import type { ListingRouteConfig } from '@platform/lib/anatomy/types';

export const ROUTES: ListingRouteConfig<{ id: string }> = {
  detail: (item) => ['/achats/fournisseurs', item.id],
  create: ['/achats/fournisseurs/new'],
  list: ['/achats/fournisseurs'],
};
