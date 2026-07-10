import type { ListingRouteConfig } from '@lib/anatomy/types';

export const ROUTES: ListingRouteConfig<{ id: string }> = {
  detail: (item) => ['/achats/demandes', item.id],
  create: ['/achats/demandes/new'],
  list: ['/achats/demandes'],
};
