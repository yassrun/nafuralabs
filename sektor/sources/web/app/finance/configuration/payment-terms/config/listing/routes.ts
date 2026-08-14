/**
 * PaymentTerm Listing Routes — Auto-generated from payment-term.entity.json
 */

import type { ListingRouteConfig } from '@platform/lib/anatomy/types';
import type { PaymentTermListItem } from '../../models';

export const ROUTES: ListingRouteConfig<PaymentTermListItem> = {
  detail: (item) => ['/finance/configuration/payment-terms', item.id],
  create: ['/finance/configuration/payment-terms/new'],
  list: ['/finance/configuration/payment-terms'],
};
