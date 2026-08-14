import type { DetailRouteConfig } from '@platform/lib/anatomy/types';

export const ROUTES: DetailRouteConfig<{ id: string }> = {
  list: ['/hse/formations'],
  edit: (item) => ['/hse/formations', item.id],
  view: (item) => ['/hse/formations', item.id],
};
