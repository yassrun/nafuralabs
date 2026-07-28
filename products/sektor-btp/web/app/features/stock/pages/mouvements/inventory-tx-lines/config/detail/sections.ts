/**
 * InventoryTxLine Detail Sections — Auto-generated from inventory-tx-line.entity.json
 */

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { InventoryTxLine } from '../../models';

export const SECTIONS: DetailSectionConfig<InventoryTxLine>[] = [
  {
    id: 'general',
    title: 'inventory.sections.general',
    fields: ['inventoryTxId', 'lineNumber', 'itemId', 'quantity', 'unitPrice', 'totalPrice', 'notes'],
    columns: 2,
  },
];
