import type { DetailRouteConfig } from '@platform/lib/anatomy/types';

export const ROUTES: DetailRouteConfig<{ id: string }> = {
  list: ['/achats/consultations'],
  edit: (item) => ['/achats/consultations', item.id],
  view: (item) => ['/achats/consultations', item.id],
};
