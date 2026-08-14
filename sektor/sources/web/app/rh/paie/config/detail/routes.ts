import type { DetailRouteConfig } from '@platform/lib/anatomy/types';

export const ROUTES: DetailRouteConfig<{ id: string }> = {
  list: ['/rh/paie'],
  edit: (item) => ['/rh/paie', item.id],
  view: (item) => ['/rh/paie', item.id],
};
