import type { ListingRouteConfig } from '@lib/anatomy/types';

export const ROUTES: ListingRouteConfig<{ id: string }> = {
  detail: (item) => ['/ventes/bons-commandes-clients', item.id],
  create: ['/ventes/bons-commandes-clients/new'],
  list: ['/ventes/bons-commandes-clients'],
};
