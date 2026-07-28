import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { FactureClient } from '@app/features/ventes/models';

export const ROUTES: ListingRouteConfig<FactureClient> = {
  detail: (item) => ['/ventes/factures', item.id],
  create: ['/ventes/factures/new'],
  list: ['/ventes/factures'],
};
