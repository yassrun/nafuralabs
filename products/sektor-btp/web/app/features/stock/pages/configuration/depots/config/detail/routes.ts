/**
 * Location Configuration Detail Routes
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { LocationConfig } from '../../models';

export const ROUTES: DetailRouteConfig<LocationConfig> = {
  list: ['/stock/configuration/depots'],
  edit: (item) => ['/stock/configuration/depots', item.id],
  view: (item) => ['/stock/configuration/depots', item.id],
};
