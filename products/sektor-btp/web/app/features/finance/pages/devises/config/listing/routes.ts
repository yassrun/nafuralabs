import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { Devise } from '@app/features/finance/models';

export const ROUTES: ListingRouteConfig<Devise> = {
  detail: (item) => ['/finance/devises', item.id],
  create: ['/finance/devises/new'],
  list: ['/finance/devises'],
};
