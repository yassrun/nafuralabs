import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { TransfertListItem } from '../../services/transfert.facade';

export const TRANSFERT_LISTING_ROUTES: ListingRouteConfig<TransfertListItem> = {
  list: ['/stock/mouvements/transferts'],
  detail: (item) => ['/stock/mouvements/transferts', item.id],
  create: ['/stock/mouvements/transferts/new'],
};