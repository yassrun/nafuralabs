/**
 * PaymentTerm Detail Configuration — Auto-generated from payment-term.entity.json
 */

import { buildDetailConfig } from '@lib/anatomy';
import type { PaymentTerm } from '../../models';

import { FIELDS } from './fields';
import { SECTIONS } from './sections';
import { ROUTES } from './routes';

export const PAYMENT_TERM_DETAIL_CONFIG = buildDetailConfig<PaymentTerm>(
  {
    entityName: 'PaymentTerm',
    permissionPrefix: 'currency.payment-term',
    fields: FIELDS,
    routes: ROUTES,
  },
  {
    sections: SECTIONS,
    saveSuccessMessage: (item) => `Payment Term "${(item as any).name || (item as any).code || item.id}" saved successfully`,
    deleteConfirm: {
      title: 'Delete Payment Term',
      message: (item) => `Are you sure you want to delete "${(item as any).name || (item as any).code || item.id}"?`,
    },
  }
);
