/**
 * ItemPrice Listing Configuration — Auto-generated from item-price.entity.json
 */

import { buildListingConfig } from '@lib/anatomy';
import type { ItemPriceListItem } from '../../models';

import { COLUMNS } from './columns';
import { ROUTES } from './routes';
import { FILTERS } from './filters';

export const ITEM_PRICE_LISTING_CONFIG = buildListingConfig<ItemPriceListItem>(
  {
    entityName: 'ItemPrice',
    entityNamePlural: 'Item Prices',
    columns: COLUMNS,
    routes: ROUTES,
    permissionPrefix: 'item.item-price',
  },
  {
    filters: FILTERS,
    defaultSort: {
      column: 'effectiveFrom',
      direction: 'desc',
    },
    features: {},
    emptyState: {
      icon: 'file-text',
    },
  }
);
