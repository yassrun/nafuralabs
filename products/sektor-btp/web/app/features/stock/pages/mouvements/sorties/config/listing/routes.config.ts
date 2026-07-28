import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { SortieListItem } from '../../services/sortie.facade';

export const SORTIE_LISTING_ROUTES: ListingRouteConfig<SortieListItem> = {
  list: ['/stock/mouvements/sorties'],
  detail: (item) => ['/stock/mouvements/sorties', item.id],
  create: ['/stock/mouvements/sorties/new'],
};
