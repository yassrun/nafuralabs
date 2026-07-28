import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { Metre } from '@app/features/etudes/models';

export const ROUTES: DetailRouteConfig<Metre> = {
  list: ['/etudes/metres'],
  edit: (item) => ['/etudes/metres', item.id],
  view: (item) => ['/etudes/metres', item.id],
};
