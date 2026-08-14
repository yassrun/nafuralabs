import type { ListingRouteConfig } from '@lib/anatomy/types';

export const ROUTES: ListingRouteConfig<{ id: string }> = {
  detail: (item) => ['/ventes/offres', item.id],
  create: ['/ventes/offres/new'],
  list: ['/ventes/offres'],
};
