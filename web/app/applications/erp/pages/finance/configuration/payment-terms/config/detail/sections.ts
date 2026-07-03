/**
 * PaymentTerm Detail Sections — Auto-generated from payment-term.entity.json
 */

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { PaymentTerm } from '../../models';

export const SECTIONS: DetailSectionConfig<PaymentTerm>[] = [
  {
    id: 'general',
    title: 'finance.sections.general',
    fields: ['code', 'name', 'days', 'discountDays', 'discountPercent', 'description', 'isActive'],
    columns: 2,
  },
];
