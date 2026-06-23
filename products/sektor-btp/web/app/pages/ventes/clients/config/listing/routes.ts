import type { ListingRouteConfig } from '@lib/anatomy/types';

export const ROUTES: ListingRouteConfig<{ id: string }> = {
  detail: (item) => ['/ventes/clients', item.id],
  create: ['/ventes/clients/new'],
  list: ['/ventes/clients'],
};
