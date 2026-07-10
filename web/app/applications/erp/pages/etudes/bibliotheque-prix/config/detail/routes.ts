import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { Ouvrage } from '@applications/erp/etudes/models';

export const ROUTES: DetailRouteConfig<Ouvrage> = {
  list: ['/etudes/bibliotheque-prix'],
  edit: (item) => ['/etudes/bibliotheque-prix', item.id],
  view: (item) => ['/etudes/bibliotheque-prix', item.id],
};
