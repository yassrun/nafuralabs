import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { Devis } from '@applications/erp/etudes/models';

export const ROUTES: ListingRouteConfig<Devis> = {
  detail: (item) => ['/etudes/devis', item.id],
  create: ['/etudes/devis/new'],
  list: ['/etudes/devis'],
};
