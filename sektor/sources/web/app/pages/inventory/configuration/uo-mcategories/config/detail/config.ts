/**
 * UoMCategory Detail Configuration — Auto-generated from uo-mcategory.entity.json
 */

import { buildDetailConfig } from '@lib/anatomy';
import type { UoMCategory } from '../../models';

import { FIELDS } from './fields';
import { SECTIONS } from './sections';
import { ROUTES } from './routes';

export const UO_MCATEGORY_DETAIL_CONFIG = buildDetailConfig<UoMCategory>(
  {
    entityName: 'UoMCategory',
    permissionPrefix: 'item.uo-mcategory',
    fields: FIELDS,
    routes: ROUTES,
  },
  {
    sections: SECTIONS,
    saveSuccessMessage: (item) => `Uo M Category "${(item as any).name || (item as any).code || item.id}" saved successfully`,
    deleteConfirm: {
      title: 'Delete Uo M Category',
      message: (item) => `Are you sure you want to delete "${(item as any).name || (item as any).code || item.id}"?`,
    },
  }
);
