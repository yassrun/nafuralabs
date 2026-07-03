import type { ListingRouteConfig } from '@lib/anatomy/types';

export const ROUTES: ListingRouteConfig<{ id: string }> = {
  detail: (item) => ['/rh/employes', item.id],
  create: ['/rh/employes/new'],
  list: ['/rh/employes'],
};
