import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { ConditionPaiement } from '@applications/erp/finance/models';

export const ROUTES: ListingRouteConfig<ConditionPaiement> = {
  detail: (item) => ['/finance/conditions-paiement', item.id],
  create: ['/finance/conditions-paiement/new'],
  list: ['/finance/conditions-paiement'],
};
