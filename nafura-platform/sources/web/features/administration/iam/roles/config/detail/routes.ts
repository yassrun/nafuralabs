import type { DetailRouteConfig } from '@lib/anatomy/types';

import type { Role } from '../../models';

export const ROUTES: DetailRouteConfig<Role> = {
  list: ['/administration/roles'],
  edit: (item) => ['/administration/roles', item.id],
};
