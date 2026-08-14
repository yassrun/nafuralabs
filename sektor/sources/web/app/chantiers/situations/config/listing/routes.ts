import type { ListingRouteConfig } from '@platform/lib/anatomy/types';
import type { Situation } from '@app/chantiers/models';

export const ROUTES: ListingRouteConfig<Situation> = {
  detail: (item) => ['/chantiers/situations', item.id],
  create: ['/chantiers/situations/new'],
  list: ['/chantiers/situations'],
};
