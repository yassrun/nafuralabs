/**
 * PaymentTerm Listing Columns — Auto-generated from payment-term.entity.json
 */

import type { ColumnConfig } from '@lib/anatomy/types';

export const COLUMNS: ColumnConfig[] = [
  {
    key: 'code',
    label: 'finance.fields.code',
    field: 'code',
    sortable: true,
  },
  {
    key: 'name',
    label: 'finance.fields.name',
    field: 'name',
    sortable: true,
  },
  {
    key: 'days',
    label: 'finance.fields.days',
    field: 'days',
    type: 'number',
    sortable: true,
  },
  {
    key: 'isActive',
    label: 'common.fields.isActive',
    field: 'isActive',
    type: 'boolean',
  },
];
