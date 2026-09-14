import type { ListingRouteConfig } from '@lib/anatomy/types';

import type { PrintTemplate } from '../../models';

export const ROUTES: ListingRouteConfig<PrintTemplate> = {
  list: ['/administration/documents/templates'],
  detail: (item) => ['/administration/documents/templates', item.id],
  create: ['/administration/documents/templates/new'],
};
