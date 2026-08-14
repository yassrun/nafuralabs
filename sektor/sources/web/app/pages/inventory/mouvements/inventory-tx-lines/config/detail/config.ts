/**
 * InventoryTxLine Detail Configuration — Auto-generated from inventory-tx-line.entity.json
 *
 * NOTE: Stub configuration. The inventory-tx-lines page is not yet implemented.
 * When implemented, convert to `buildInventoryTxLineDetailConfig(t: TranslateService)`
 * factory pattern (see other configs in this module).
 */

import { buildDetailConfig } from '@lib/anatomy';
import type { InventoryTxLine } from '../../models';

import { FIELDS } from './fields';
import { SECTIONS } from './sections';
import { ROUTES } from './routes';

/* eslint-disable no-hardcoded-string */
export const INVENTORY_TX_LINE_DETAIL_CONFIG = buildDetailConfig<InventoryTxLine>(
  {
    entityName: 'InventoryTxLine',
    permissionPrefix: 'stock.inventory-tx-line',
    fields: FIELDS,
    routes: ROUTES,
  },
  {
    sections: SECTIONS,
    saveSuccessMessage: (item) => `Inventory Tx Line "${(item as any).name || (item as any).code || item.id}" saved successfully`,
    deleteConfirm: {
      // @i18n-exempt: stub config; entity not surfaced in user-facing UI (see inventory-tx.page placeholder)
      title: 'Delete Inventory Tx Line',
      message: (item) => `Are you sure you want to delete "${(item as any).name || (item as any).code || item.id}"?`,
    },
  }
);
