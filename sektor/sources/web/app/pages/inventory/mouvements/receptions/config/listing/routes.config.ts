import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { ReceptionListItem } from '../../services';

export const RECEPTION_PANEL_ROUTES: ListingRouteConfig<ReceptionListItem> = {
  list: ['/inventory/mouvements/receptions'],
  detail: (item) => ['/inventory/mouvements/receptions', item.id],
  create: ['/inventory/mouvements/receptions/new'],
};