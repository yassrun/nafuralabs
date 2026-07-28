/**
 * UoMCategory Detail Routes — Auto-generated from uo-mcategory.entity.json
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { UoMCategory } from '../../models';

export const ROUTES: DetailRouteConfig<UoMCategory> = {
  list: ['/stock/configuration/uo-mcategories'],
  edit: (item) => ['/stock/configuration/uo-mcategories', item.id],
  view: (item) => ['/stock/configuration/uo-mcategories', item.id],
};
