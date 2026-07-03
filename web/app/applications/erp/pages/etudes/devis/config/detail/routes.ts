import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { Devis } from '@applications/erp/etudes/models';

export const ROUTES: DetailRouteConfig<Devis> = {
  list: ['/etudes/devis'],
  edit: (item) => ['/etudes/devis', item.id],
  view: (item) => ['/etudes/devis', item.id],
};
