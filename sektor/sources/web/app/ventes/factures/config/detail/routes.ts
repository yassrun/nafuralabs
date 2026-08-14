import type { DetailRouteConfig } from '@platform/lib/anatomy/types';
import type { FactureClient } from '@app/ventes/models';

export const ROUTES: DetailRouteConfig<FactureClient> = {
  list: ['/ventes/factures'],
  edit: (item) => ['/ventes/factures', item.id],
  view: (item) => ['/ventes/factures', item.id],
};
