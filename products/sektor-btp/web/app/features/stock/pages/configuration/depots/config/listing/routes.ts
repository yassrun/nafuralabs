/**
 * Location Configuration Listing Routes
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { LocationConfigListItem } from '../../models';

export const ROUTES: ListingRouteConfig<LocationConfigListItem> = {
  detail: (item) => ['/stock/configuration/depots', item.id],
  create: ['/stock/configuration/depots/new'],
  list: ['/stock/configuration/depots'],
};
