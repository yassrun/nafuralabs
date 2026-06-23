import type { DetailRouteConfig } from '@lib/anatomy/types';

export const ROUTES: DetailRouteConfig<{ id: string }> = {
  list: ['/ventes/offres'],
  edit: (item) => ['/ventes/offres', item.id],
  view: (item) => ['/ventes/offres', item.id],
};
