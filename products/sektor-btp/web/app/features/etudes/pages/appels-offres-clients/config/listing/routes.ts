import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { AppelOffreClient } from '@app/features/etudes/models';

export const ROUTES: ListingRouteConfig<AppelOffreClient> = {
  detail: (item) => ['/etudes/appels-offres-clients', item.id],
  create: ['/etudes/appels-offres-clients/new'],
  list: ['/etudes/appels-offres-clients'],
};
