import type { ListingRouteConfig } from '@lib/anatomy/types';

export const ROUTES: ListingRouteConfig<{ id: string }> = {
  detail: (item) => ['/hse/non-conformites', item.id],
  create: ['/hse/non-conformites/new'],
  list: ['/hse/non-conformites'],
};
