import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { SortieListItem } from '../../services/sortie.facade';

export const SORTIE_LISTING_ROUTES: ListingRouteConfig<SortieListItem> = {
  list: ['/inventory/mouvements/sorties'],
  detail: (item) => ['/inventory/mouvements/sorties', item.id],
  create: ['/inventory/mouvements/sorties/new'],
};
