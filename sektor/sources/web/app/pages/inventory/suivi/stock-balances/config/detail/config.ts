/**
 * StockBalance Detail Configuration — Auto-generated from stock-balance.entity.json
 *
 * NOTE: Stub configuration. The stock-balances detail page is not yet wired into the
 * suivi navigation. When implemented, convert to `buildStockBalanceDetailConfig(t: TranslateService)`
 * factory pattern (see other configs in this module).
 */

import { buildDetailConfig } from '@lib/anatomy';
import type { StockBalance } from '../../models';

import { FIELDS } from './fields';
import { SECTIONS } from './sections';
import { ROUTES } from './routes';

/* eslint-disable no-hardcoded-string */
export const STOCK_BALANCE_DETAIL_CONFIG = buildDetailConfig<StockBalance>(
  {
    entityName: 'StockBalance',
    permissionPrefix: 'stock.stock-balance',
    fields: FIELDS,
    routes: ROUTES,
  },
  {
    sections: SECTIONS,
    saveSuccessMessage: (item) => `Stock Balance "${(item as any).name || (item as any).code || item.id}" saved successfully`,
    deleteConfirm: {
      // @i18n-exempt: stub config; entity not user-facing (suivi/etat-stock is the live page)
      title: 'Delete Stock Balance',
      message: (item) => `Are you sure you want to delete "${(item as any).name || (item as any).code || item.id}"?`,
    },
  }
);
