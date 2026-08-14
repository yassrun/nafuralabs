import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { TransfertListItem } from '../../services/transfert.facade';

export const TRANSFERT_LISTING_ROUTES: ListingRouteConfig<TransfertListItem> = {
  list: ['/inventory/mouvements/transferts'],
  detail: (item) => ['/inventory/mouvements/transferts', item.id],
  create: ['/inventory/mouvements/transferts/new'],
};