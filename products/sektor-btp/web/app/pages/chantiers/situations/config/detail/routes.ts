import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { Situation } from '@applications/erp/chantiers/models';

export const ROUTES: DetailRouteConfig<Situation> = {
  list: ['/chantiers/situations'],
  edit: (item) => ['/chantiers/situations', item.id],
  view: (item) => ['/chantiers/situations', item.id],
};
