import type { DetailRouteConfig } from '@lib/anatomy/types';

export const ROUTES: DetailRouteConfig<{ id: string }> = {
  list: ['/ventes/bons-commandes-clients'],
  edit: (item) => ['/ventes/bons-commandes-clients', item.id],
  view: (item) => ['/ventes/bons-commandes-clients', item.id],
};
