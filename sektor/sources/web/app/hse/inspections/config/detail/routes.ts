import type { DetailRouteConfig } from '@platform/lib/anatomy/types';

export const ROUTES: DetailRouteConfig<{ id: string }> = {
  list: ['/hse/inspections'],
  edit: (item) => ['/hse/inspections', item.id],
  view: (item) => ['/hse/inspections', item.id],
};
