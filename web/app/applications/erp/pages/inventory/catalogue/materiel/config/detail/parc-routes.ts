/**
 * Parc matériel detail routes (instances under /materiel/parc).
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { Materiel } from '../../models';

export const PARC_DETAIL_ROUTES: DetailRouteConfig<Materiel> = {
  list: ['/materiel/parc'],
  view: (entity) => ['/materiel/parc', entity.id],
  edit: (entity) => ['/materiel/parc', entity.id, 'edit'],
};
