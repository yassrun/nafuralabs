/**
 * StockBalance API Service — Auto-generated from stock-balance.entity.json
 * Safe to regenerate — custom logic goes in the facade.
 */

import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService, type ListResponse } from '@lib/anatomy';
import type {
  ItemQuantityAggregate,
  StockBalance,
  StockBalanceCreate,
  StockBalanceUpdate,
} from '../models';

@Injectable({ providedIn: 'root' })
export class StockBalancesApiService extends FeatureApiService<StockBalance, StockBalanceCreate, StockBalanceUpdate> {
  protected override basePath = '/api/v1/stock-balances';
  protected override searchFields = ['locationId', 'itemId'];

  async listFiltered(query: {
    locationId?: string;
    warehouseId?: string;
    itemId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ListResponse<StockBalance>> {
    let params = this.buildQueryParams({
      page: query.page ?? 0,
      pageSize: query.pageSize ?? 500,
    });
    const locationId = query.locationId ?? query.warehouseId;
    if (locationId) {
      params = params.set('locationId', locationId);
    }
    if (query.itemId) {
      params = params.set('itemId', query.itemId);
    }
    const response = await this.get<unknown>(this.basePath, params);
    return this.normalizeListResponse(response);
  }

  async aggregateByItemIds(itemIds: string[]): Promise<ItemQuantityAggregate[]> {
    if (!itemIds.length) return [];
    const params = new HttpParams().set('itemIds', itemIds.join(','));
    return this.get<ItemQuantityAggregate[]>(`${this.basePath}/aggregate-by-item`, params);
  }
}
