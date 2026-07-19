import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { Consultation } from '../../models';

export const ROUTES: ListingRouteConfig<Consultation> = {
  detail: (item) => ['/etudes/consultation', item.id],
  create: ['/etudes/consultation/new'],
  list: ['/etudes/consultation'],
};
