import type { ListingRouteConfig } from '@lib/anatomy/types';

export const ROUTES: ListingRouteConfig<{ id: string }> = {
  detail: (item) => ['/achats/appels-offres', item.id],
  create: ['/achats/appels-offres/new'],
  list: ['/achats/appels-offres'],
};
