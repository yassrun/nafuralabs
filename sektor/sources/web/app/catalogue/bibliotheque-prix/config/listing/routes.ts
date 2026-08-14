import type { ListingRouteConfig } from '@platform/lib/anatomy/types';
import type { Ouvrage } from '@app/etudes/models';

export const ROUTES: ListingRouteConfig<Ouvrage> = {
  detail: (item) => ['/etudes/bibliotheque-prix', item.id],
  create: ['/etudes/bibliotheque-prix/new'],
  list: ['/etudes/bibliotheque-prix'],
};
