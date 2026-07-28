/**
 * UoM Category Detail Routes
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { UomCategoryConfig } from '../../models';

export const ROUTES: DetailRouteConfig<UomCategoryConfig> = {
  list: ['/stock/configuration/uom-categories'],
  edit: (item) => ['/stock/configuration/uom-categories', item.id],
  view: (item) => ['/stock/configuration/uom-categories', item.id],
};
