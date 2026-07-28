/**
 * ItemType Listing Configuration — Auto-generated from item-type.entity.json
 */

import { buildListingConfig } from '@lib/anatomy';
import type { ItemTypeListItem } from '../../models';

import { COLUMNS } from './columns';
import { ROUTES } from './routes';
import { FILTERS } from './filters';

export const ITEM_TYPE_LISTING_CONFIG = buildListingConfig<ItemTypeListItem>(
  {
    entityName: 'ItemType',
    entityNamePlural: 'Item Types',
    columns: COLUMNS,
    routes: ROUTES,
    permissionPrefix: 'item.item-type',
  },
  {
    filters: FILTERS,
    defaultSort: {
      column: 'code',
      direction: 'asc',
    },
    features: {},
    emptyState: {
      icon: 'tag',
    },
  }
);
