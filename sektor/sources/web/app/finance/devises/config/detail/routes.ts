import type { DetailRouteConfig } from '@platform/lib/anatomy/types';
import type { Devise } from '@app/finance/models';

export const ROUTES: DetailRouteConfig<Devise> = {
  list: ['/finance/devises'],
  edit: (item) => ['/finance/devises', item.id],
  view: (item) => ['/finance/devises', item.id],
};
