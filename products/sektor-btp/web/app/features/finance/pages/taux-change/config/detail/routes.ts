import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { TauxChange } from '@app/features/finance/models';

export const ROUTES: DetailRouteConfig<TauxChange> = {
  list: ['/finance/taux-change'],
  edit: (item) => ['/finance/taux-change', item.id],
  view: (item) => ['/finance/taux-change', item.id],
};
