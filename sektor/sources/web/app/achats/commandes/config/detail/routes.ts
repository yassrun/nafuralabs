import type { DetailRouteConfig } from '@platform/lib/anatomy/types';

export const ROUTES: DetailRouteConfig<{ id: string }> = {
  list: ['/achats/commandes'],
  edit: (item) => ['/achats/commandes', item.id],
  view: (item) => ['/achats/commandes', item.id],
};
