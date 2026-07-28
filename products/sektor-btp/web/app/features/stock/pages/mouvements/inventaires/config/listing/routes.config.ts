import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { InventaireListItem } from '../../services/inventaire.facade';

export const INVENTAIRE_LISTING_ROUTES: ListingRouteConfig<InventaireListItem> = {
  list: ['/stock/mouvements/inventaires'],
  detail: (item) => ['/stock/mouvements/inventaires', item.id],
  create: ['/stock/mouvements/inventaires/new'],
};