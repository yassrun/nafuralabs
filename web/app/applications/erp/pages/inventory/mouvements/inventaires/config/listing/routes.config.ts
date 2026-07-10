import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { InventaireListItem } from '../../services/inventaire.facade';

export const INVENTAIRE_LISTING_ROUTES: ListingRouteConfig<InventaireListItem> = {
  list: ['/inventory/mouvements/inventaires'],
  detail: (item) => ['/inventory/mouvements/inventaires', item.id],
  create: ['/inventory/mouvements/inventaires/new'],
};