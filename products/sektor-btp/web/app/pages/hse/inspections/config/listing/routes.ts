import type { ListingRouteConfig } from '@lib/anatomy/types';

export const ROUTES: ListingRouteConfig<{ id: string }> = {
  detail: (item) => ['/hse/inspections', item.id],
  create: ['/hse/inspections/new'],
  list: ['/hse/inspections'],
};
