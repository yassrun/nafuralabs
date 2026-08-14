import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { Avoir } from '@app/ventes/models';

export const ROUTES: ListingRouteConfig<Avoir> = {
  detail: (item) => ['/ventes/avoirs', item.id],
  create: ['/ventes/avoirs/new'],
  list: ['/ventes/avoirs'],
};
