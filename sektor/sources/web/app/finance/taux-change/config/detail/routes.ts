import type { DetailRouteConfig } from '@platform/lib/anatomy/types';
import type { TauxChange } from '@app/finance/models';

export const ROUTES: DetailRouteConfig<TauxChange> = {
  list: ['/finance/taux-change'],
  edit: (item) => ['/finance/taux-change', item.id],
  view: (item) => ['/finance/taux-change', item.id],
};
