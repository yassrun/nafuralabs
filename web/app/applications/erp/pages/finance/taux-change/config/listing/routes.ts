import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { TauxChange } from '@applications/erp/finance/models';

export const ROUTES: ListingRouteConfig<TauxChange> = {
  detail: (item) => ['/finance/taux-change', item.id],
  create: ['/finance/taux-change/new'],
  list: ['/finance/taux-change'],
};
