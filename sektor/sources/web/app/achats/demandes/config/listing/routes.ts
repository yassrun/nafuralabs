import type { ListingRouteConfig } from '@platform/lib/anatomy/types';

export const ROUTES: ListingRouteConfig<{ id: string }> = {
  detail: (item) => ['/achats/demandes', item.id],
  create: ['/achats/demandes/new'],
  list: ['/achats/demandes'],
};
