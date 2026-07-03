import type { DetailRouteConfig } from '@lib/anatomy/types';

export const ROUTES: DetailRouteConfig<{ id: string }> = {
  list: ['/hse/non-conformites'],
  edit: (item) => ['/hse/non-conformites', item.id],
  view: (item) => ['/hse/non-conformites', item.id],
};
