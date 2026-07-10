import type { DetailRouteConfig } from '@lib/anatomy/types';

import type { Member } from '../../models';

export const ROUTES: DetailRouteConfig<Member> = {
  list: ['/administration/members'],
  edit: (item) => ['/administration/members', item.id],
};
