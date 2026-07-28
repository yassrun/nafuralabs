/**
 * Unit of Measure Listing Routes
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { UomListItem } from '../../models';

export const ROUTES: ListingRouteConfig<UomListItem> = {
  detail: (item) => ['/stock/configuration/uom', item.id],
  create: ['/stock/configuration/uom/new'],
  list: ['/stock/configuration/uom'],
};
