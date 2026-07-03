/**
 * Item Detail Configuration — Auto-generated from item.entity.json
 */

import { buildDetailConfig } from '@lib/anatomy';
import type { Item } from '../../models';

import { FIELDS } from './fields';
import { SECTIONS } from './sections';
import { ROUTES } from './routes';

export const ITEM_DETAIL_CONFIG = buildDetailConfig<Item>(
  {
    entityName: 'Item',
    permissionPrefix: 'item.item',
    fields: FIELDS,
    routes: ROUTES,
  },
  {
    sections: SECTIONS,
    saveSuccessMessage: (item) => `Item "${(item as any).name || (item as any).code || item.id}" saved successfully`,
    deleteConfirm: {
      title: 'Delete Item',
      message: (item) => `Are you sure you want to delete "${(item as any).name || (item as any).code || item.id}"?`,
    },
  }
);
