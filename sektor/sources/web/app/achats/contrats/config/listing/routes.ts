import type { ListingRouteConfig } from '@platform/lib/anatomy/types';

export const ROUTES: ListingRouteConfig<{ id: string }> = {
  detail: (item) => ['/achats/contrats', item.id],
  create: ['/achats/contrats/new'],
  list: ['/achats/contrats'],
};
