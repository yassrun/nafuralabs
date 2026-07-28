import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { AlertListItem } from '../services/alertes-reappro.facade';

export const ALERTES_LISTING_ROUTES: ListingRouteConfig<AlertListItem> = {
  list: ['/stock/suivi/alertes'],
  create: ['/stock/suivi/alertes'],
  detail: (item) => ['/stock/suivi/alertes', item.id],
};
