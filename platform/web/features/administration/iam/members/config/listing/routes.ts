import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { MemberListItem } from '../../models';

export const ROUTES: ListingRouteConfig<MemberListItem> = {
  detail: (item) => ['/administration/members', item.id],
  create: ['/administration/members/new'],
  list: ['/administration/members'],
};
