/**
 * UoM Category Detail Routes
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { UomCategoryConfig } from '../../models';

export const ROUTES: DetailRouteConfig<UomCategoryConfig> = {
  list: ['/inventory/configuration/uom-categories'],
  edit: (item) => ['/inventory/configuration/uom-categories', item.id],
  view: (item) => ['/inventory/configuration/uom-categories', item.id],
};
