import type { DetailRouteConfig } from '@lib/anatomy/types';

export const ROUTES: DetailRouteConfig<{ id: string }> = {
  list: ['/achats/appels-offres'],
  edit: (item) => ['/achats/appels-offres', item.id],
  view: (item) => ['/achats/appels-offres', item.id],
};
