/**
 * ItemType Detail Configuration — Auto-generated from item-type.entity.json
 */

import { buildDetailConfig } from '@lib/anatomy';
import type { ItemType } from '../../models';

import { FIELDS } from './fields';
import { SECTIONS } from './sections';
import { ROUTES } from './routes';

export const ITEM_TYPE_DETAIL_CONFIG = buildDetailConfig<ItemType>(
  {
    entityName: 'ItemType',
    permissionPrefix: 'item.item-type',
    fields: FIELDS,
    routes: ROUTES,
  },
  {
    sections: SECTIONS,
    saveSuccessMessage: (item) => `Item Type "${(item as any).name || (item as any).code || item.id}" saved successfully`,
    deleteConfirm: {
      title: 'Delete Item Type',
      message: (item) => `Are you sure you want to delete "${(item as any).name || (item as any).code || item.id}"?`,
    },
  }
);
