/**
 * Currency Detail Configuration — Auto-generated from currency.entity.json
 */

import { buildDetailConfig } from '@lib/anatomy';
import type { Currency } from '../../models';

import { FIELDS } from './fields';
import { SECTIONS } from './sections';
import { ROUTES } from './routes';

export const CURRENCY_DETAIL_CONFIG = buildDetailConfig<Currency>(
  {
    entityName: 'Currency',
    permissionPrefix: 'currency.currency',
    fields: FIELDS,
    routes: ROUTES,
  },
  {
    sections: SECTIONS,
    saveSuccessMessage: (item) => `Currency "${(item as any).name || (item as any).code || item.id}" saved successfully`,
    deleteConfirm: {
      title: 'Delete Currency',
      message: (item) => `Are you sure you want to delete "${(item as any).name || (item as any).code || item.id}"?`,
    },
  }
);
