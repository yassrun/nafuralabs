/**
 * UnitOfMeasure Detail Configuration — Auto-generated from unit-of-measure.entity.json
 */

import { buildDetailConfig } from '@lib/anatomy';
import type { UnitOfMeasure } from '../../models';

import { FIELDS } from './fields';
import { SECTIONS } from './sections';
import { ROUTES } from './routes';

export const UNIT_OF_MEASURE_DETAIL_CONFIG = buildDetailConfig<UnitOfMeasure>(
  {
    entityName: 'UnitOfMeasure',
    permissionPrefix: 'item.unit-of-measure',
    fields: FIELDS,
    routes: ROUTES,
  },
  {
    sections: SECTIONS,
    saveSuccessMessage: (item) => `Unit Of Measure "${(item as any).name || (item as any).code || item.id}" saved successfully`,
    deleteConfirm: {
      title: 'Delete Unit Of Measure',
      message: (item) => `Are you sure you want to delete "${(item as any).name || (item as any).code || item.id}"?`,
    },
  }
);
