import type { ListingRouteConfig } from '@platform/lib/anatomy/types';

export const ROUTES: ListingRouteConfig<{ id: string }> = {
  detail: (item) => ['/rh/conges', item.id],
  create: ['/rh/conges/new'],
  list: ['/rh/conges'],
};
