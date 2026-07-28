/**
 * UnitOfMeasure Listing Routes — Auto-generated from unit-of-measure.entity.json
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { UnitOfMeasureListItem } from '../../models';

export const ROUTES: ListingRouteConfig<UnitOfMeasureListItem> = {
  detail: (item) => ['/stock/units-of-measure', item.id],
  create: ['/stock/units-of-measure/new'],
  list: ['/stock/units-of-measure'],
};
