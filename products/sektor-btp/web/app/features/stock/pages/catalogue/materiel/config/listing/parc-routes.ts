/**
 * Parc matériel listing routes (instances under /materiel/parc).
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { MaterielListItem } from '../../models';

export const PARC_ROUTES: ListingRouteConfig<MaterielListItem> = {
  detail: (item) => ['/materiel/parc', item.id],
  create: ['/materiel/parc/new'],
  list: ['/materiel/parc'],
};
