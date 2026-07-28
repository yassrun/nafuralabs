/**
 * Costing Method Detail Routes
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { CostingMethodConfig } from '../../models';

export const ROUTES: DetailRouteConfig<CostingMethodConfig> = {
  list: ['/stock/configuration/costing-methods'],
  edit: (item) => ['/stock/configuration/costing-methods', item.id],
  view: (item) => ['/stock/configuration/costing-methods', item.id],
};
