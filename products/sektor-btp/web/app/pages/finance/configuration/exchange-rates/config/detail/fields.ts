/**
 * ExchangeRate Detail Fields — Auto-generated from exchange-rate.entity.json
 */

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { ExchangeRate } from '../../models';

export const FIELDS: DetailFieldConfig<ExchangeRate>[] = [
  {
    key: 'fromCurrencyId',
    label: 'finance.fields.fromCurrency',
    type: 'select',
    required: true,
    width: 'md',
    lookupKey: 'currencies',
    lookupEndpoint: '/api/v1/currencies/lookup',
    lookupDisplayField: 'code',
    lookupValueField: 'id',
    searchable: true,
    referenceRoute: '/finance/configuration/currencies',
  },
  {
    key: 'toCurrencyId',
    label: 'finance.fields.toCurrency',
    type: 'select',
    required: true,
    width: 'md',
    lookupKey: 'currencies',
    lookupEndpoint: '/api/v1/currencies/lookup',
    lookupDisplayField: 'code',
    lookupValueField: 'id',
    searchable: true,
    referenceRoute: '/finance/configuration/currencies',
  },
  {
    key: 'rate',
    label: 'finance.fields.rate',
    type: 'number',
    required: true,
    width: 'md',
    validators: [{ type: 'min', value: 0 }],
  },
  {
    key: 'effectiveDate',
    label: 'finance.fields.effectiveDate',
    type: 'date',
    required: true,
    width: 'md',
  },
  {
    key: 'source',
    label: 'finance.fields.source',
    type: 'text',
    width: 'md',
    validators: [{ type: 'maxLength', value: 50 }],
  },
];
