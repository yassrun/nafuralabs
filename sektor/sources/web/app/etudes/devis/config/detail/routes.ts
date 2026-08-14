import type { DetailRouteConfig } from '@platform/lib/anatomy/types';
import type { Devis } from '@app/etudes/models';

export const ROUTES: DetailRouteConfig<Devis> = {
  list: ['/etudes/devis'],
  edit: (item) => ['/etudes/devis', item.id],
  view: (item) => ['/etudes/devis', item.id],
};
