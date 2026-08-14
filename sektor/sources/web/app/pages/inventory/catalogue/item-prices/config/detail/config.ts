/**
 * ItemPrice Detail Configuration — Auto-generated from item-price.entity.json
 */

import { buildDetailConfig } from '@lib/anatomy';
import type { ItemPrice } from '../../models';

import { FIELDS } from './fields';
import { SECTIONS } from './sections';
import { ROUTES } from './routes';

export const ITEM_PRICE_DETAIL_CONFIG = buildDetailConfig<ItemPrice>(
  {
    entityName: 'ItemPrice',
    permissionPrefix: 'item.item-price',
    fields: FIELDS,
    routes: ROUTES,
  },
  {
    sections: SECTIONS,
    saveSuccessMessage: (item) => `Item Price "${(item as any).name || (item as any).code || item.id}" saved successfully`,
    deleteConfirm: {
      title: 'Delete Item Price',
      message: (item) => `Are you sure you want to delete "${(item as any).name || (item as any).code || item.id}"?`,
    },
  }
);
