import type { DetailRouteConfig } from '@platform/lib/anatomy/types';

export const ROUTES: DetailRouteConfig<{ id: string }> = {
  list: ['/rh/employes'],
  edit: (item) => ['/rh/employes', item.id],
  view: (item) => ['/rh/employes', item.id],
};
