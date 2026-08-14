import type { DetailRouteConfig } from '@platform/lib/anatomy/types';
import type { Avoir } from '@app/ventes/models';

export const ROUTES: DetailRouteConfig<Avoir> = {
  list: ['/ventes/avoirs'],
  edit: (item) => ['/ventes/avoirs', item.id],
  view: (item) => ['/ventes/avoirs', item.id],
};
