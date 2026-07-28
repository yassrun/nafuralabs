import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { RetourListItem } from '../../services/retour.facade';

export const RETOUR_LISTING_ROUTES: ListingRouteConfig<RetourListItem> = {
  list: ['/stock/mouvements/retours'],
  detail: (item) => ['/stock/mouvements/retours', item.id],
  create: ['/stock/mouvements/retours/new'],
};