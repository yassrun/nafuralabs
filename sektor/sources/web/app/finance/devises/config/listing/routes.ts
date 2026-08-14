import type { ListingRouteConfig } from '@platform/lib/anatomy/types';
import type { Devise } from '@app/finance/models';

export const ROUTES: ListingRouteConfig<Devise> = {
  detail: (item) => ['/finance/devises', item.id],
  create: ['/finance/devises/new'],
  list: ['/finance/devises'],
};
