/**
 * Unit of Measure Detail Routes
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { UomConfig } from '../../models';

export const ROUTES: DetailRouteConfig<UomConfig> = {
  list: ['/inventory/configuration/uom'],
  edit: (item) => ['/inventory/configuration/uom', item.id],
  view: (item) => ['/inventory/configuration/uom', item.id],
};
