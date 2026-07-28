/**
 * Unit of Measure Detail Routes
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { UomConfig } from '../../models';

export const ROUTES: DetailRouteConfig<UomConfig> = {
  list: ['/stock/configuration/uom'],
  edit: (item) => ['/stock/configuration/uom', item.id],
  view: (item) => ['/stock/configuration/uom', item.id],
};
