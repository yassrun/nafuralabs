/**
 * UoMCategory Detail Routes — Auto-generated from uo-mcategory.entity.json
 */

import type { DetailRouteConfig } from '@platform/lib/anatomy/types';
import type { UoMCategory } from '../../models';

export const ROUTES: DetailRouteConfig<UoMCategory> = {
  list: ['/inventory/configuration/uo-mcategories'],
  edit: (item) => ['/inventory/configuration/uo-mcategories', item.id],
  view: (item) => ['/inventory/configuration/uo-mcategories', item.id],
};
