/**
 * Item Listing Configuration — Auto-generated from item.entity.json
 */

import { buildListingConfig } from '@lib/anatomy';
import type { ItemListItem } from '../../models';

import { COLUMNS } from './columns';
import { ROUTES } from './routes';
import { FILTERS } from './filters';

export const ITEM_LISTING_CONFIG = buildListingConfig<ItemListItem>(
  {
    entityName: 'Item',
    entityNamePlural: 'Items',
    columns: COLUMNS,
    routes: ROUTES,
    permissionPrefix: 'item.item',
  },
  {
    filters: FILTERS,
    defaultSort: {
      column: 'code',
      direction: 'asc',
    },
    features: {},
    emptyState: {
      icon: 'package',
    },
  }
);
