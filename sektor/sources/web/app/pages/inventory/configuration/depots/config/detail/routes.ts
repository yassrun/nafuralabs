/**
 * Location Configuration Detail Routes
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { LocationConfig } from '../../models';

export const ROUTES: DetailRouteConfig<LocationConfig> = {
  list: ['/inventory/configuration/depots'],
  edit: (item) => ['/inventory/configuration/depots', item.id],
  view: (item) => ['/inventory/configuration/depots', item.id],
};
