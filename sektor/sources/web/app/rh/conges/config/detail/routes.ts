import type { DetailRouteConfig } from '@platform/lib/anatomy/types';

export const ROUTES: DetailRouteConfig<{ id: string }> = {
  list: ['/rh/conges'],
  edit: (item) => ['/rh/conges', item.id],
  view: (item) => ['/rh/conges', item.id],
};
