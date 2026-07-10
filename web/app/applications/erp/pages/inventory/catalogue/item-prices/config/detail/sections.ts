/**
 * ItemPrice Detail Sections — Auto-generated from item-price.entity.json
 */

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { ItemPrice } from '../../models';

export const SECTIONS: DetailSectionConfig<ItemPrice>[] = [
  {
    id: 'general',
    title: 'directory.sections.general',
    fields: ['itemId', 'priceType', 'currencyId', 'unitPrice', 'minQuantity', 'effectiveFrom', 'effectiveTo'],
    columns: 2,
  },
];
