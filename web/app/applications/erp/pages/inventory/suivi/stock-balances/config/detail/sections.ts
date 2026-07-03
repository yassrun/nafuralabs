/**
 * StockBalance Detail Sections — Auto-generated from stock-balance.entity.json
 */

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { StockBalance } from '../../models';

export const SECTIONS: DetailSectionConfig<StockBalance>[] = [
  {
    id: 'general',
    title: 'inventory.sections.general',
    fields: ['warehouseId', 'itemId', 'quantity', 'reservedQuantity', 'availableQuantity', 'lastCountDate'],
    columns: 2,
  },
];
