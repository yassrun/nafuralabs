import type { ListingRouteConfig } from '@platform/lib/anatomy/types';
import type { Metre } from '@app/etudes/models';

export const ROUTES: ListingRouteConfig<Metre> = {
  detail: (item) => ['/etudes/metres', item.id],
  create: ['/etudes/metres/new'],
  list: ['/etudes/metres'],
};
