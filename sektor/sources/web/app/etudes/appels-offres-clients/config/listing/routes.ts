import type { ListingRouteConfig } from '@platform/lib/anatomy/types';
import type { AppelOffreClient } from '@app/etudes/models';

export const ROUTES: ListingRouteConfig<AppelOffreClient> = {
  detail: (item) => ['/etudes/appels-offres-clients', item.id],
  create: ['/etudes/appels-offres-clients/new'],
  list: ['/etudes/appels-offres-clients'],
};
