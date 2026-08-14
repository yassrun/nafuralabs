import type { ListingRouteConfig } from '@lib/anatomy/types';

export const ROUTES: ListingRouteConfig<{ id: string }> = {
  detail: (item) => ['/achats/contrats', item.id],
  create: ['/achats/contrats/new'],
  list: ['/achats/contrats'],
};
