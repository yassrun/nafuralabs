/**
 * Famille Article Detail Routes
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { FamilleArticleConfig } from '../../models';

export const ROUTES: DetailRouteConfig<FamilleArticleConfig> = {
  list: ['/inventory/configuration/familles'],
  edit: (item) => ['/inventory/configuration/familles', item.id],
  view: (item) => ['/inventory/configuration/familles', item.id],
};
