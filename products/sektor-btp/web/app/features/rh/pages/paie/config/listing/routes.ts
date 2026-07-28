import type { ListingRouteConfig } from '@lib/anatomy/types';

export const ROUTES: ListingRouteConfig<{ id: string }> = {
  detail: (item) => ['/rh/paie', item.id],
  create: ['/rh/paie/new'],
  list: ['/rh/paie'],
};
