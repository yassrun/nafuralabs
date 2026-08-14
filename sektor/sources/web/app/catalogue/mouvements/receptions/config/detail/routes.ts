import type { DetailRouteConfig } from '@platform/lib/anatomy/types';

import type { InventoryTx } from '../../../../models';

export const RECEPTION_DETAIL_ROUTES: DetailRouteConfig<InventoryTx> = {
  list: ['/inventory/mouvements/receptions'],
  edit: (item) => ['/inventory/mouvements/receptions', item.id],
  view: (item) => ['/inventory/mouvements/receptions', item.id],
};
