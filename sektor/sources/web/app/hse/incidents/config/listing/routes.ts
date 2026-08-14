import type { ListingRouteConfig } from '@platform/lib/anatomy/types';

export const ROUTES: ListingRouteConfig<{ id: string }> = {
  detail: (item) => ['/hse/incidents', item.id],
  create: ['/hse/incidents/new'],
  list: ['/hse/incidents'],
};
