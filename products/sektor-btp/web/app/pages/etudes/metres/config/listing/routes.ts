import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { Metre } from '@applications/erp/etudes/models';

export const ROUTES: ListingRouteConfig<Metre> = {
  detail: (item) => ['/etudes/metres', item.id],
  create: ['/etudes/metres/new'],
  list: ['/etudes/metres'],
};
