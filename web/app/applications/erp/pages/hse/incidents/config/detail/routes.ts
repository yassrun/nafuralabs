import type { DetailRouteConfig } from '@lib/anatomy/types';

export const ROUTES: DetailRouteConfig<{ id: string }> = {
  list: ['/hse/incidents'],
  edit: (item) => ['/hse/incidents', item.id],
  view: (item) => ['/hse/incidents', item.id],
};
