import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { ConditionPaiement } from '@applications/erp/finance/models';

export const ROUTES: DetailRouteConfig<ConditionPaiement> = {
  list: ['/finance/conditions-paiement'],
  edit: (item) => ['/finance/conditions-paiement', item.id],
  view: (item) => ['/finance/conditions-paiement', item.id],
};
