import type { DetailRouteConfig } from '@platform/lib/anatomy/types';

export const ROUTES: DetailRouteConfig<{ id: string }> = {
  list: ['/achats/demandes'],
  edit: (item) => ['/achats/demandes', item.id],
  view: (item) => ['/achats/demandes', item.id],
};
