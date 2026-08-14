import type { DetailRouteConfig } from '@platform/lib/anatomy/types';

export const ROUTES: DetailRouteConfig<{ id: string }> = {
  list: ['/achats/contrats'],
  edit: (item) => ['/achats/contrats', item.id],
  view: (item) => ['/achats/contrats', item.id],
};
