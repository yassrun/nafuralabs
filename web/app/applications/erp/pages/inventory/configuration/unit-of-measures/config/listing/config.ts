/**
 * UnitOfMeasure Listing Configuration — Auto-generated from unit-of-measure.entity.json
 */

import { buildListingConfig } from '@lib/anatomy';
import type { UnitOfMeasureListItem } from '../../models';

import { COLUMNS } from './columns';
import { ROUTES } from './routes';
import { FILTERS } from './filters';

export const UNIT_OF_MEASURE_LISTING_CONFIG = buildListingConfig<UnitOfMeasureListItem>(
  {
    entityName: 'UnitOfMeasure',
    entityNamePlural: 'Unit Of Measures',
    columns: COLUMNS,
    routes: ROUTES,
    permissionPrefix: 'item.unit-of-measure',
  },
  {
    filters: FILTERS,
    defaultSort: {
      column: 'code',
      direction: 'asc',
    },
    features: {},
    emptyState: {
      icon: 'ruler',
    },
  }
);
