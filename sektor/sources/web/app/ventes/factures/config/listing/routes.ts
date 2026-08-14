import type { ListingRouteConfig } from '@platform/lib/anatomy/types';
import type { FactureClient } from '@app/ventes/models';

export const ROUTES: ListingRouteConfig<FactureClient> = {
  detail: (item) => ['/ventes/factures', item.id],
  create: ['/ventes/factures/new'],
  list: ['/ventes/factures'],
};
