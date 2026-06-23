import type { DetailRouteConfig } from '@lib/anatomy/types';

export const ROUTES: DetailRouteConfig<{ id: string }> = {
  list: ['/hse/formations'],
  edit: (item) => ['/hse/formations', item.id],
  view: (item) => ['/hse/formations', item.id],
};
