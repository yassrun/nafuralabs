import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { Devise } from '@applications/erp/finance/models';

export const ROUTES: DetailRouteConfig<Devise> = {
  list: ['/finance/devises'],
  edit: (item) => ['/finance/devises', item.id],
  view: (item) => ['/finance/devises', item.id],
};
