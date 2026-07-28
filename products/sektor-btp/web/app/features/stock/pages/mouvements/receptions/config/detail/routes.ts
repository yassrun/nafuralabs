import type { DetailRouteConfig } from '@lib/anatomy/types';

import type { InventoryTx } from '@app/features/stock/models';

export const RECEPTION_DETAIL_ROUTES: DetailRouteConfig<InventoryTx> = {
  list: ['/stock/mouvements/receptions'],
  edit: (item) => ['/stock/mouvements/receptions', item.id],
  view: (item) => ['/stock/mouvements/receptions', item.id],
};
