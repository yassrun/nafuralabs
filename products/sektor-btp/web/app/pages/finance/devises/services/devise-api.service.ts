import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';

import {
  type ApiCurrencyRow,
  currencyToDevise,
  deviseToCurrencyCreate,
  deviseToCurrencyUpdate,
} from '@applications/erp/finance/services/currency-finance.mapper';
import type { Devise, DeviseCreate, DeviseUpdate } from '@applications/erp/finance/models';

interface DeviseQuery extends ListQuery {
  isActive?: boolean | string;
  isDeviseDeReference?: boolean | string;
}

@Injectable({ providedIn: 'root' })
export class DeviseApiService extends FeatureApiService<Devise, DeviseCreate, DeviseUpdate> {
  protected override basePath = '/api/v1/currencies';
  protected override searchFields = ['code', 'name'];

  override async getAll(query?: ListQuery): Promise<ListResponse<Devise>> {
    const q = (query ?? {}) as DeviseQuery;
    let params = new HttpParams()
      .set('page', String((q.page ?? 1) > 0 ? (q.page ?? 1) - 1 : 0))
      .set('size', String(q.pageSize && q.pageSize > 0 ? q.pageSize : 500));

    if (q['search']) {
      params = params.set('search', String(q['search']));
    }
    if (q.sortBy) {
      const dir = q.sortDirection === 'desc' ? 'desc' : 'asc';
      params = params.set('sort', `${q.sortBy === 'libelle' ? 'name' : q.sortBy},${dir}`);
    }

    const response = await this.get<unknown>(this.basePath, params);
    const normalized = this.normalizeListResponse(response);
    let items = (normalized.items as unknown as ApiCurrencyRow[]).map(currencyToDevise);

    if (q.isActive !== undefined && q.isActive !== '') {
      const wanted = q.isActive === true || q.isActive === 'true';
      items = items.filter((d) => d.isActive === wanted);
    }
    if (q.isDeviseDeReference !== undefined && q.isDeviseDeReference !== '') {
      const wanted = q.isDeviseDeReference === true || q.isDeviseDeReference === 'true';
      items = items.filter((d) => d.isDeviseDeReference === wanted);
    }

    return { items, total: normalized.total ?? items.length };
  }

  override async getById(id: string | number): Promise<Devise> {
    const row = await this.get<ApiCurrencyRow>(`${this.basePath}/${id}`);
    return currencyToDevise(row);
  }

  override async create(data: DeviseCreate): Promise<Devise> {
    const row = await this.post<ApiCurrencyRow>(this.basePath, deviseToCurrencyCreate(data));
    return currencyToDevise(row);
  }

  override async update(id: string | number, data: DeviseUpdate): Promise<Devise> {
    const row = await this.put<ApiCurrencyRow>(`${this.basePath}/${id}`, deviseToCurrencyUpdate(data));
    return currencyToDevise(row);
  }
}
