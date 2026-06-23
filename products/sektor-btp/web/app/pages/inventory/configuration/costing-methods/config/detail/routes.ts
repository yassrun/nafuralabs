/**
 * Costing Method Detail Routes
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { CostingMethodConfig } from '../../models';

export const ROUTES: DetailRouteConfig<CostingMethodConfig> = {
  list: ['/inventory/configuration/costing-methods'],
  edit: (item) => ['/inventory/configuration/costing-methods', item.id],
  view: (item) => ['/inventory/configuration/costing-methods', item.id],
};
