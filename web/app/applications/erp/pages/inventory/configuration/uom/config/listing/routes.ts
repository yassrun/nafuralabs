/**
 * Unit of Measure Listing Routes
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { UomListItem } from '../../models';

export const ROUTES: ListingRouteConfig<UomListItem> = {
  detail: (item) => ['/inventory/configuration/uom', item.id],
  create: ['/inventory/configuration/uom/new'],
  list: ['/inventory/configuration/uom'],
};
