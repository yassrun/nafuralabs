/**
 * PaymentTerm Detail Routes — Auto-generated from payment-term.entity.json
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { PaymentTerm } from '../../models';

export const ROUTES: DetailRouteConfig<PaymentTerm> = {
  list: ['/finance/configuration/payment-terms'],
  edit: (item) => ['/finance/configuration/payment-terms', item.id],
  view: (item) => ['/finance/configuration/payment-terms', item.id],
};
