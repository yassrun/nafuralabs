/**
 * Grid Facade
 *
 * Standardized facade base for config-driven listing + detail pages.
 * Extends FeatureFacade and implements CrudFacade for consistent contracts.
 *
 * Note: This base assumes list item type matches detail item type.
 * If you need different list item types, implement CrudFacade manually.
 */

import type { CrudFacade, ListQuery, ListResponse } from '../types';
import { FeatureApiService } from './feature-api.service';
import { FeatureFacade } from './feature-facade.class';

export abstract class GridFacade<
  TItem,
  TCreate = Partial<TItem>,
  TUpdate extends Partial<TCreate> = Partial<TCreate>,
  TQuery extends ListQuery = ListQuery,
  TId extends string | number = string,
  TApi extends FeatureApiService<TItem, TCreate, TUpdate> = FeatureApiService<TItem, TCreate, TUpdate>
> extends FeatureFacade<TItem, TApi>
  implements CrudFacade<TItem, TItem, TCreate, TQuery, TId>
{
  override async loadItems(query?: TQuery): Promise<ListResponse<TItem>> {
    return super.loadItems(query);
  }

  async getItem(id: TId): Promise<TItem> {
    return super.loadItem(id);
  }

  override async createItem(input: TCreate): Promise<TItem> {
    return super.createItem(input as Parameters<TApi['create']>[0]);
  }

  override async updateItem(id: TId, input: Partial<TCreate>): Promise<TItem> {
    return super.updateItem(id, input as Parameters<TApi['update']>[1]);
  }

  override async deleteItem(id: TId): Promise<void> {
    return super.deleteItem(id);
  }
}
