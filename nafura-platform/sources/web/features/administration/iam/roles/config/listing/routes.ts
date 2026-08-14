import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { RoleListItem } from '../../models';

export const ROUTES: ListingRouteConfig<RoleListItem> = {
  detail: (item) => ['/administration/roles', item.id],
  create: ['/administration/roles/new'],
  list: ['/administration/roles'],
};
