/**
 * Matériel Detail Routes
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { Materiel } from '../../models';

export const ROUTES: DetailRouteConfig<Materiel> = {
  list: ['/inventory/catalogue/materiel'],
  view: (entity) => ['/inventory/catalogue/materiel', entity.id],
  edit: (entity) => ['/inventory/catalogue/materiel', entity.id, 'edit'],
};
