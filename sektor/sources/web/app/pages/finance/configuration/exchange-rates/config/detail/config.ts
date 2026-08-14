/**
 * ExchangeRate Detail Configuration — Auto-generated from exchange-rate.entity.json
 */

import { buildDetailConfig } from '@lib/anatomy';
import type { ExchangeRate } from '../../models';

import { FIELDS } from './fields';
import { SECTIONS } from './sections';
import { ROUTES } from './routes';

export const EXCHANGE_RATE_DETAIL_CONFIG = buildDetailConfig<ExchangeRate>(
  {
    entityName: 'ExchangeRate',
    permissionPrefix: 'currency.exchange-rate',
    fields: FIELDS,
    routes: ROUTES,
  },
  {
    sections: SECTIONS,
    saveSuccessMessage: (item) => `Exchange Rate "${(item as any).name || (item as any).code || item.id}" saved successfully`,
    deleteConfirm: {
      title: 'Delete Exchange Rate',
      message: (item) => `Are you sure you want to delete "${(item as any).name || (item as any).code || item.id}"?`,
    },
  }
);
