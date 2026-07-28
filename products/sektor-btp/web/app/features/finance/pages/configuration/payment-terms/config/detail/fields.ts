/**
 * PaymentTerm Detail Fields — Auto-generated from payment-term.entity.json
 */

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { PaymentTerm } from '../../models';

export const FIELDS: DetailFieldConfig<PaymentTerm>[] = [
  {
    key: 'code',
    label: 'finance.fields.code',
    type: 'text',
    required: true,
    readonlyOnEdit: true,
    width: 'md',
    validators: [{ type: 'maxLength', value: 50 }],
  },
  {
    key: 'name',
    label: 'finance.fields.name',
    type: 'text',
    required: true,
    width: 'md',
    validators: [{ type: 'maxLength', value: 200 }],
  },
  {
    key: 'days',
    label: 'finance.fields.days',
    type: 'number',
    required: true,
    width: 'md',
    validators: [{ type: 'min', value: 0 }, { type: 'max', value: 365 }],
  },
  {
    key: 'discountDays',
    label: 'finance.fields.discountDays',
    type: 'number',
    width: 'md',
    validators: [{ type: 'min', value: 0 }],
  },
  {
    key: 'discountPercent',
    label: 'finance.fields.discountPercent',
    type: 'number',
    width: 'md',
    validators: [{ type: 'min', value: 0 }, { type: 'max', value: 100 }],
  },
  {
    key: 'description',
    label: 'finance.fields.description',
    type: 'textarea',
    width: 'full',
    validators: [{ type: 'maxLength', value: 2000 }],
  },
  {
    key: 'isActive',
    label: 'common.fields.isActive',
    type: 'toggle',
    width: 'sm',
  },
];
