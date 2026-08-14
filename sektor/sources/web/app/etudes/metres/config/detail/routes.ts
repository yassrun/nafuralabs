import type { DetailRouteConfig } from '@platform/lib/anatomy/types';
import type { Metre } from '@app/etudes/models';

export const ROUTES: DetailRouteConfig<Metre> = {
  list: ['/etudes/metres'],
  edit: (item) => ['/etudes/metres', item.id],
  view: (item) => ['/etudes/metres', item.id],
};
