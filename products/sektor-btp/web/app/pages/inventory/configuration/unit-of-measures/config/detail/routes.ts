/**
 * UnitOfMeasure Detail Routes — Auto-generated from unit-of-measure.entity.json
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { UnitOfMeasure } from '../../models';

export const ROUTES: DetailRouteConfig<UnitOfMeasure> = {
  list: ['/inventory/units-of-measure'],
  edit: (item) => ['/inventory/units-of-measure', item.id],
  view: (item) => ['/inventory/units-of-measure', item.id],
};
