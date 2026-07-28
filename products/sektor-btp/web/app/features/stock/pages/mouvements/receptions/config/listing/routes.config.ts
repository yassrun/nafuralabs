import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { ReceptionListItem } from '../../services';

export const RECEPTION_PANEL_ROUTES: ListingRouteConfig<ReceptionListItem> = {
  list: ['/stock/mouvements/receptions'],
  detail: (item) => ['/stock/mouvements/receptions', item.id],
  create: ['/stock/mouvements/receptions/new'],
};