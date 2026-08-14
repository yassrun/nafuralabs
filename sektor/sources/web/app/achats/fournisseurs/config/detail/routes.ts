import type { DetailRouteConfig } from '@platform/lib/anatomy/types';

export const ROUTES: DetailRouteConfig<{ id: string }> = {
  list: ['/achats/fournisseurs'],
  edit: (item) => ['/achats/fournisseurs', item.id],
  view: (item) => ['/achats/fournisseurs', item.id],
};
