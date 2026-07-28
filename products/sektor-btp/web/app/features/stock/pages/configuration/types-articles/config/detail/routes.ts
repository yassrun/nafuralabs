/**
 * Type Article Detail Routes
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { TypeArticleConfig } from '../../models';

export const ROUTES: DetailRouteConfig<TypeArticleConfig> = {
  list: ['/stock/configuration/types-articles'],
  edit: (item) => ['/stock/configuration/types-articles', item.id],
  view: (item) => ['/stock/configuration/types-articles', item.id],
};
