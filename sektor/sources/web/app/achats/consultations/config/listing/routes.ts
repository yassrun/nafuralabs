import type { ListingRouteConfig } from '@platform/lib/anatomy/types';

export const ROUTES: ListingRouteConfig<{ id: string }> = {
  detail: (item) => ['/achats/consultations', item.id],
  create: ['/achats/consultations/new'],
  list: ['/achats/consultations'],
};
