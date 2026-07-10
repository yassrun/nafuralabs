/**
 * ItemCategory Listing Configuration — Auto-generated from item-category.entity.json
 */

import { buildListingConfig } from '@lib/anatomy';
import type { ItemCategoryListItem } from '../../models';

import { COLUMNS } from './columns';
import { ROUTES } from './routes';
import { FILTERS } from './filters';

export const ITEM_CATEGORY_LISTING_CONFIG = buildListingConfig<ItemCategoryListItem>(
  {
    entityName: 'ItemCategory',
    entityNamePlural: 'Item Categories',
    columns: COLUMNS,
    routes: ROUTES,
    permissionPrefix: 'item.item-category',
  },
  {
    filters: FILTERS,
    defaultSort: {
      column: 'code',
      direction: 'asc',
    },
    features: {},
    emptyState: {
      icon: 'bookmark',
    },
  }
);
