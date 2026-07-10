/**
 * Currency Detail Sections — Auto-generated from currency.entity.json
 */

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { Currency } from '../../models';

export const SECTIONS: DetailSectionConfig<Currency>[] = [
  {
    id: 'general',
    title: 'finance.sections.general',
    fields: ['code', 'name', 'symbol', 'decimalPlaces', 'isActive'],
    columns: 2,
  },
];
