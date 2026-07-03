import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { RetourListItem } from '../../services/retour.facade';

export const RETOUR_LISTING_ROUTES: ListingRouteConfig<RetourListItem> = {
  list: ['/inventory/mouvements/retours'],
  detail: (item) => ['/inventory/mouvements/retours', item.id],
  create: ['/inventory/mouvements/retours/new'],
};