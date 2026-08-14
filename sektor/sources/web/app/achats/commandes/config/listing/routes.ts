import type { ListingRouteConfig } from '@platform/lib/anatomy/types';

export const ROUTES: ListingRouteConfig<{ id: string }> = {
  detail: (item) => ['/achats/commandes', item.id],
  create: ['/achats/commandes/new'],
  list: ['/achats/commandes'],
};
