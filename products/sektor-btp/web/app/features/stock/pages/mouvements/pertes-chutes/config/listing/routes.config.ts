import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { PerteListItem } from '../../services/perte.facade';

export const PERTE_LISTING_ROUTES: ListingRouteConfig<PerteListItem> = {
  list: ['/stock/mouvements/pertes-chutes'],
  detail: (item) => ['/stock/mouvements/pertes-chutes', item.id],
  create: ['/stock/mouvements/pertes-chutes/new'],
};