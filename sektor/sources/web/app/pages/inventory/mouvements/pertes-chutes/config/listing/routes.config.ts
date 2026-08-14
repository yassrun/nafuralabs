import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { PerteListItem } from '../../services/perte.facade';

export const PERTE_LISTING_ROUTES: ListingRouteConfig<PerteListItem> = {
  list: ['/inventory/mouvements/pertes-chutes'],
  detail: (item) => ['/inventory/mouvements/pertes-chutes', item.id],
  create: ['/inventory/mouvements/pertes-chutes/new'],
};