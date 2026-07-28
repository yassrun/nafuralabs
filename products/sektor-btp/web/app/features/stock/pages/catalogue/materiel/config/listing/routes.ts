/**
 * Matériel Listing Routes
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { MaterielListItem } from '../../models';

export const ROUTES: ListingRouteConfig<MaterielListItem> = {
  detail: (item) => ['/stock/catalogue/materiel', item.id],
  create: ['/stock/catalogue/materiel/new'],
  list: ['/stock/catalogue/materiel'],
};
