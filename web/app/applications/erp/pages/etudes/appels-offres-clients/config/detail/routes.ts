import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { AppelOffreClient } from '@applications/erp/etudes/models';

export const ROUTES: DetailRouteConfig<AppelOffreClient> = {
  list: ['/etudes/appels-offres-clients'],
  edit: (item) => ['/etudes/appels-offres-clients', item.id],
  view: (item) => ['/etudes/appels-offres-clients', item.id],
};
