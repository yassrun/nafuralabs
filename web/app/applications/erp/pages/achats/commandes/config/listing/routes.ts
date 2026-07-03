import type { ListingRouteConfig } from '@lib/anatomy/types';

export const ROUTES: ListingRouteConfig<{ id: string }> = {
  detail: (item) => ['/achats/commandes', item.id],
  create: ['/achats/commandes/new'],
  list: ['/achats/commandes'],
};
