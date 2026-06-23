import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { Avoir } from '@applications/erp/ventes/models';

export const ROUTES: DetailRouteConfig<Avoir> = {
  list: ['/ventes/avoirs'],
  edit: (item) => ['/ventes/avoirs', item.id],
  view: (item) => ['/ventes/avoirs', item.id],
};
