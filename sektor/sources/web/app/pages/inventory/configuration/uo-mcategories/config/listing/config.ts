/**
 * UoMCategory Listing Configuration — Auto-generated from uo-mcategory.entity.json
 */

import { buildListingConfig } from '@lib/anatomy';
import type { UoMCategoryListItem } from '../../models';

import { COLUMNS } from './columns';
import { ROUTES } from './routes';
import { FILTERS } from './filters';

export const UO_MCATEGORY_LISTING_CONFIG = buildListingConfig<UoMCategoryListItem>(
  {
    entityName: 'UoMCategory',
    entityNamePlural: 'Uo M Categories',
    columns: COLUMNS,
    routes: ROUTES,
    permissionPrefix: 'item.uo-mcategory',
  },
  {
    filters: FILTERS,
    defaultSort: {
      column: 'code',
      direction: 'asc',
    },
    features: {},
    emptyState: {
      icon: 'file-text',
    },
  }
);
