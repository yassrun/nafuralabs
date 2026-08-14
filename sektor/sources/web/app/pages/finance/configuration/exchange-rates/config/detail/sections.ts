/**
 * ExchangeRate Detail Sections — Auto-generated from exchange-rate.entity.json
 */

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { ExchangeRate } from '../../models';

export const SECTIONS: DetailSectionConfig<ExchangeRate>[] = [
  {
    id: 'general',
    title: 'finance.sections.general',
    fields: ['fromCurrencyId', 'toCurrencyId', 'rate', 'effectiveDate', 'source'],
    columns: 2,
  },
];
