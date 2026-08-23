import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { FeatureApiService } from '@platform/lib/anatomy';
import type { Item, ItemCreate, ItemUpdate } from '../items/models';

export interface ItemPickerSearchQuery {
  q?: string;
  nature?: string;
  familleId?: string;
  usageLot?: string;
  page?: number;
  size?: number;
  isActive?: boolean;
}

export interface ItemPickerSearchPage {
  items: Item[];
  total: number;
  last: boolean;
}

/**
 * Shared Items API — moved out of dead catalogue/items tree (stock Lot 6).
 */
@Injectable({ providedIn: 'root' })
export class ItemsApiService extends FeatureApiService<Item, ItemCreate, ItemUpdate> {
  protected override basePath = '/api/v1/items';
  protected override searchFields = ['code', 'name', 'sku', 'cleStable'];

  /** Picker — surface `/search`, pas le listing CRUD. */
  async searchPicker(query: ItemPickerSearchQuery = {}): Promise<ItemPickerSearchPage> {
    let params = new HttpParams();
    if (query.q?.trim()) params = params.set('q', query.q.trim());
    if (query.nature) params = params.set('nature', query.nature);
    if (query.familleId) params = params.set('familleId', query.familleId);
    if (query.usageLot) params = params.set('usageLot', query.usageLot);
    if (query.isActive !== undefined) params = params.set('isActive', String(query.isActive));
    params = params.set('page', String(query.page ?? 0));
    params = params.set('size', String(query.size ?? 20));
    const res = await this.get<{
      content?: Item[];
      totalElements?: number;
      last?: boolean;
    }>(`${this.basePath}/search`, params);
    const items = res.content ?? [];
    return {
      items,
      total: Number(res.totalElements ?? items.length),
      last: res.last === true || items.length < (query.size ?? 20),
    };
  }

  extraireCreer(body: {
    designation: string;
    nature?: string;
    uniteCode?: string;
    cleStable?: string | null;
  }): Promise<{
    itemId: string;
    cleStable: string;
    libelle: string;
    createdSektor: boolean;
    createdItem: boolean;
  }> {
    return this.post(`${this.basePath}/extraire-creer`, body);
  }
}
