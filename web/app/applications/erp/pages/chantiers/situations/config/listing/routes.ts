import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { Situation } from '@applications/erp/chantiers/models';

export const ROUTES: ListingRouteConfig<Situation> = {
  detail: (item) => ['/chantiers/situations', item.id],
  create: ['/chantiers/situations/new'],
  list: ['/chantiers/situations'],
};
