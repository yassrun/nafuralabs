import type { DetailRouteConfig } from '@lib/anatomy/types';

export const ROUTES: DetailRouteConfig<{ id: string }> = {
  list: ['/achats/commandes'],
  edit: (item) => ['/achats/commandes', item.id],
  view: (item) => ['/achats/commandes', item.id],
};
