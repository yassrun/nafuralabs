/**
 * UnitOfMeasure Detail Routes — Auto-generated from unit-of-measure.entity.json
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { UnitOfMeasure } from '../../models';

export const ROUTES: DetailRouteConfig<UnitOfMeasure> = {
  list: ['/stock/units-of-measure'],
  edit: (item) => ['/stock/units-of-measure', item.id],
  view: (item) => ['/stock/units-of-measure', item.id],
};
