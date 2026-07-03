/**
 * Currency Detail Fields — Auto-generated from currency.entity.json
 */

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { Currency } from '../../models';

export const FIELDS: DetailFieldConfig<Currency>[] = [
  {
    key: 'code',
    label: 'finance.fields.code',
    type: 'text',
    required: true,
    readonlyOnEdit: true,
    width: 'md',
    validators: [{ type: 'maxLength', value: 3 }, { type: 'minLength', value: 3 }, { type: 'pattern', pattern: '^[A-Z]{3}$' }],
  },
  {
    key: 'name',
    label: 'finance.fields.name',
    type: 'text',
    required: true,
    width: 'md',
    validators: [{ type: 'maxLength', value: 100 }],
  },
  {
    key: 'symbol',
    label: 'finance.fields.symbol',
    type: 'text',
    width: 'md',
    validators: [{ type: 'maxLength', value: 10 }],
  },
  {
    key: 'decimalPlaces',
    label: 'finance.fields.decimalPlaces',
    type: 'number',
    required: true,
    width: 'md',
    validators: [{ type: 'min', value: 0 }, { type: 'max', value: 6 }],
  },
  {
    key: 'isActive',
    label: 'common.fields.isActive',
    type: 'toggle',
    width: 'sm',
  },
];
