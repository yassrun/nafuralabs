/**
 * Matériel Listing Routes
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { MaterielListItem } from '../../models';

export const ROUTES: ListingRouteConfig<MaterielListItem> = {
  detail: (item) => ['/inventory/catalogue/materiel', item.id],
  create: ['/inventory/catalogue/materiel/new'],
  list: ['/inventory/catalogue/materiel'],
};
