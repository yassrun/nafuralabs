/**
 * Matériel Detail Routes
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { Materiel } from '../../models';

export const ROUTES: DetailRouteConfig<Materiel> = {
  list: ['/stock/catalogue/materiel'],
  view: (entity) => ['/stock/catalogue/materiel', entity.id],
  edit: (entity) => ['/stock/catalogue/materiel', entity.id, 'edit'],
};
