/**
 * Location Configuration Listing Routes
 */

import type { ListingRouteConfig } from '@platform/lib/anatomy/types';
import type { LocationConfigListItem } from '../../models';

export const ROUTES: ListingRouteConfig<LocationConfigListItem> = {
  detail: (item) => ['/inventory/configuration/depots', item.id],
  create: ['/inventory/configuration/depots/new'],
  list: ['/inventory/configuration/depots'],
};
