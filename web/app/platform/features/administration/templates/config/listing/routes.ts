import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { PrintTemplate } from '../../models';

export const ROUTES: ListingRouteConfig<PrintTemplate> = {
  list: ['/administration/templates'],
  detail: (item) => ['/administration/templates', item.id],
  create: ['/administration/templates/new'],
};
