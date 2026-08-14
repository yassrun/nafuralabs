import type { DetailRouteConfig } from '@platform/lib/anatomy/types';
import type { Situation } from '@app/chantiers/models';

export const ROUTES: DetailRouteConfig<Situation> = {
  list: ['/chantiers/situations'],
  edit: (item) => ['/chantiers/situations', item.id],
  view: (item) => ['/chantiers/situations', item.id],
};
