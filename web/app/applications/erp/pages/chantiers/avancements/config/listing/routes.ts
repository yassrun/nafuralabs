import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { AvancementListItem } from '../../models';

export const ROUTES: ListingRouteConfig<AvancementListItem> = {
  detail: (item) => ['/chantiers/avancements/saisie', item.chantierId],
  create: ['/chantiers/avancements/saisie'],
  list: ['/chantiers/avancements'],
};