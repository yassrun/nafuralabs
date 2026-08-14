import type { ListingRouteConfig } from '@platform/lib/anatomy/types';

export const ROUTES: ListingRouteConfig<{ id: string }> = {
  detail: (item) => ['/hse/formations', item.id],
  create: ['/hse/formations/new'],
  list: ['/hse/formations'],
};
