/**
 * Type Article Detail Routes
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { TypeArticleConfig } from '../../models';

export const ROUTES: DetailRouteConfig<TypeArticleConfig> = {
  list: ['/inventory/configuration/types-articles'],
  edit: (item) => ['/inventory/configuration/types-articles', item.id],
  view: (item) => ['/inventory/configuration/types-articles', item.id],
};
