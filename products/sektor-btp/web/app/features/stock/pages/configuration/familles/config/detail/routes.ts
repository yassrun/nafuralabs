/**
 * Famille Article Detail Routes
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { FamilleArticleConfig } from '../../models';

export const ROUTES: DetailRouteConfig<FamilleArticleConfig> = {
  list: ['/stock/configuration/familles'],
  edit: (item) => ['/stock/configuration/familles', item.id],
  view: (item) => ['/stock/configuration/familles', item.id],
};
