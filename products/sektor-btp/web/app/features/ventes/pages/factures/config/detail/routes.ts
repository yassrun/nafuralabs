import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { FactureClient } from '@app/features/ventes/models';

export const ROUTES: DetailRouteConfig<FactureClient> = {
  list: ['/ventes/factures'],
  edit: (item) => ['/ventes/factures', item.id],
  view: (item) => ['/ventes/factures', item.id],
};
