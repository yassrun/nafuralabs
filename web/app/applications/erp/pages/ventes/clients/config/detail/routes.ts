import type { DetailRouteConfig } from '@lib/anatomy/types';

export const ROUTES: DetailRouteConfig<{ id: string }> = {
  list: ['/ventes/clients'],
  edit: (item) => ['/ventes/clients', item.id],
  view: (item) => ['/ventes/clients', item.id],
};
