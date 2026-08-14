import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { AlertListItem } from '../services/alertes-reappro.facade';

export const ALERTES_LISTING_ROUTES: ListingRouteConfig<AlertListItem> = {
  list: ['/inventory/suivi/alertes'],
  create: ['/inventory/suivi/alertes'],
  detail: (item) => ['/inventory/suivi/alertes', item.id],
};
