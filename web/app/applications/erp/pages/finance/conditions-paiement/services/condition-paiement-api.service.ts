import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';

import {
  type ApiPaymentTermDetail,
  conditionToPaymentTermCreate,
  conditionToPaymentTermUpdate,
  paymentTermToCondition,
} from '@applications/erp/finance/services/payment-term-finance.mapper';
import type {
  ConditionPaiement,
  ConditionPaiementCreate,
  ConditionPaiementUpdate,
} from '@applications/erp/finance/models';

interface ConditionQuery extends ListQuery {
  type?: string;
  isActive?: boolean | string;
}

@Injectable({ providedIn: 'root' })
export class ConditionPaiementApiService extends FeatureApiService<
  ConditionPaiement,
  ConditionPaiementCreate,
  ConditionPaiementUpdate
> {
  protected override basePath = '/api/v1/payment-terms';
  protected override searchFields = ['code', 'name'];

  override async getAll(query?: ListQuery): Promise<ListResponse<ConditionPaiement>> {
    const q = (query ?? {}) as ConditionQuery;
    let params = new HttpParams()
      .set('page', String((q.page ?? 1) > 0 ? (q.page ?? 1) - 1 : 0))
      .set('size', String(q.pageSize && q.pageSize > 0 ? q.pageSize : 500));

    if (q['search']) {
      params = params.set('search', String(q['search']));
    }
    if (q.sortBy) {
      const field = q.sortBy === 'libelle' ? 'name' : q.sortBy;
      const dir = q.sortDirection === 'desc' ? 'desc' : 'asc';
      params = params.set('sort', `${field},${dir}`);
    }

    const response = await this.get<unknown>(this.basePath, params);
    const normalized = this.normalizeListResponse(response);
    let items = (normalized.items as unknown as ApiPaymentTermDetail[]).map(paymentTermToCondition);

    if (q.type) {
      items = items.filter((c) => c.type === q.type);
    }
    if (q.isActive !== undefined && q.isActive !== '') {
      const wanted = q.isActive === true || q.isActive === 'true';
      items = items.filter((c) => c.isActive === wanted);
    }

    return { items, total: normalized.total ?? items.length };
  }

  override async getById(id: string | number): Promise<ConditionPaiement> {
    const row = await this.get<ApiPaymentTermDetail>(`${this.basePath}/${id}`);
    return paymentTermToCondition(row);
  }

  override async create(data: ConditionPaiementCreate): Promise<ConditionPaiement> {
    const row = await this.post<ApiPaymentTermDetail>(
      this.basePath,
      conditionToPaymentTermCreate(data),
    );
    return paymentTermToCondition(row);
  }

  override async update(
    id: string | number,
    data: ConditionPaiementUpdate,
  ): Promise<ConditionPaiement> {
    const row = await this.put<ApiPaymentTermDetail>(
      `${this.basePath}/${id}`,
      conditionToPaymentTermUpdate(data),
    );
    return paymentTermToCondition(row);
  }
}
