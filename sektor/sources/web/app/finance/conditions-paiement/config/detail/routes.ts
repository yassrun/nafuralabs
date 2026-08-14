import type { DetailRouteConfig } from '@platform/lib/anatomy/types';
import type { ConditionPaiement } from '@app/finance/models';

export const ROUTES: DetailRouteConfig<ConditionPaiement> = {
  list: ['/finance/conditions-paiement'],
  edit: (item) => ['/finance/conditions-paiement', item.id],
  view: (item) => ['/finance/conditions-paiement', item.id],
};
