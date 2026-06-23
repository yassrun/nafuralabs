/**
 * InventoryTx API Service — Auto-generated from inventory-tx.entity.json
 * Safe to regenerate — custom logic goes in the facade.
 */

import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService, type ListResponse } from '@lib/anatomy';
import type { InventoryTxWithLinesBody, InventoryTxWithLinesUpdateBody } from '@applications/erp/inventory/services/inventory-tx-api.types';
import type { ApiInventoryTxDetail } from '@applications/erp/inventory/services/inventory-tx.mapper';
import type { InventoryTx, InventoryTxCreate, InventoryTxUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class InventoryTxesApiService extends FeatureApiService<InventoryTx, InventoryTxCreate, InventoryTxUpdate> {
  protected override basePath = '/api/v1/inventory-txs';
  protected override searchFields = ['txNumber', 'reference'];

  async listByTxType(
    txType: string,
    query?: { page?: number; pageSize?: number },
  ): Promise<ListResponse<InventoryTx>> {
    let params = this.buildQueryParams({
      page: query?.page ?? 0,
      pageSize: query?.pageSize ?? 500,
    });
    params = params.set('txType', txType);
    const response = await this.get<unknown>(this.basePath, params);
    return this.normalizeListResponse(response);
  }

  async getDetail(id: string): Promise<ApiInventoryTxDetail> {
    return this.get<ApiInventoryTxDetail>(`${this.basePath}/${id}/detail`);
  }

  async createWithLines(body: InventoryTxWithLinesBody): Promise<ApiInventoryTxDetail> {
    return this.post<ApiInventoryTxDetail>(`${this.basePath}/with-lines`, body);
  }

  async updateWithLines(id: string, body: InventoryTxWithLinesUpdateBody): Promise<ApiInventoryTxDetail> {
    return this.put<ApiInventoryTxDetail>(`${this.basePath}/${id}/with-lines`, body);
  }

  async submit(id: string): Promise<void> {
    await this.post(`${this.basePath}/${id}/submit`, {});
  }

  async validate(id: string): Promise<void> {
    await this.post(`${this.basePath}/${id}/validate`, {});
  }

  async cancel(id: string): Promise<void> {
    await this.post(`${this.basePath}/${id}/cancel`, {});
  }
}
