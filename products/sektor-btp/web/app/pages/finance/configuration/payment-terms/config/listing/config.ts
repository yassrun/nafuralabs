/**
 * PaymentTerm Listing Configuration — Auto-generated from payment-term.entity.json
 */

import { buildListingConfig } from '@lib/anatomy';
import type { PaymentTermListItem } from '../../models';

import { COLUMNS } from './columns';
import { ROUTES } from './routes';
import { FILTERS } from './filters';

export const PAYMENT_TERM_LISTING_CONFIG = buildListingConfig<PaymentTermListItem>(
  {
    entityName: 'PaymentTerm',
    entityNamePlural: 'Payment Terms',
    columns: COLUMNS,
    routes: ROUTES,
    permissionPrefix: 'currency.payment-term',
  },
  {
    filters: FILTERS,
    defaultSort: {
      column: 'code',
      direction: 'asc',
    },
    features: {},
    emptyState: {
      icon: 'clock',
    },
  }
);
