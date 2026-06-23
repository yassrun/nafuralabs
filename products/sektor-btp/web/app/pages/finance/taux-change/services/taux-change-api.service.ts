import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';

import { ErpLookupService } from '@applications/erp/shared/services/erp-lookup.service';
import type { ExchangeRate } from '../../configuration/exchange-rates/models';
import {
  type ApiCurrencyRow,
  buildCurrencyCodeMap,
  exchangeRateToTauxChange,
  tauxChangeToExchangeRateCreate,
  tauxChangeToExchangeRateUpdate,
} from '@applications/erp/finance/services/currency-finance.mapper';
import type {
  TauxChange,
  TauxChangeCreate,
  TauxChangeUpdate,
} from '@applications/erp/finance/models';

interface TauxQuery extends ListQuery {
  deviseDeCode?: string;
  deviseVersCode?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable({ providedIn: 'root' })
export class TauxChangeApiService extends FeatureApiService<
  TauxChange,
  TauxChangeCreate,
  TauxChangeUpdate
> {
  protected override basePath = '/api/v1/exchange-rates';
  protected override searchFields = ['source'];

  private readonly erpLookup = inject(ErpLookupService);
  private currencyCodes: Map<string, string> | null = null;

  private async loadCurrencyCodes(): Promise<Map<string, string>> {
    if (this.currencyCodes) {
      return this.currencyCodes;
    }
    const items = await this.erpLookup.currencies();
    this.currencyCodes = buildCurrencyCodeMap(
      items.map((item) => ({
        id: String(item.key),
        code: String((item.data as ApiCurrencyRow | undefined)?.code ?? item.value),
      })) as ApiCurrencyRow[],
    );
    return this.currencyCodes;
  }

  private codeToId(code: string | undefined): string | undefined {
    if (!code || !this.currencyCodes) return undefined;
    for (const [id, c] of this.currencyCodes.entries()) {
      if (c === code) return id;
    }
    return undefined;
  }

  override async getAll(query?: ListQuery): Promise<ListResponse<TauxChange>> {
    const q = (query ?? {}) as TauxQuery;
    const codeById = await this.loadCurrencyCodes();

    let params = new HttpParams()
      .set('page', String((q.page ?? 1) > 0 ? (q.page ?? 1) - 1 : 0))
      .set('size', String(q.pageSize && q.pageSize > 0 ? q.pageSize : 500));

    if (q['search']) {
      params = params.set('search', String(q['search']));
    }
    const fromId = this.codeToId(q.deviseDeCode);
    const toId = this.codeToId(q.deviseVersCode);
    if (fromId) {
      params = params.set('fromCurrencyId', fromId);
    }
    if (toId) {
      params = params.set('toCurrencyId', toId);
    }
    if (q.source) {
      params = params.set('source', q.source);
    }

    const response = await this.get<unknown>(this.basePath, params);
    const normalized = this.normalizeListResponse(response);
    let items = (normalized.items as unknown as ExchangeRate[]).map((row) =>
      exchangeRateToTauxChange(row, codeById),
    );

    if (q.deviseDeCode) {
      items = items.filter((t) => t.deviseDeCode === q.deviseDeCode);
    }
    if (q.deviseVersCode) {
      items = items.filter((t) => t.deviseVersCode === q.deviseVersCode);
    }
    if (q.dateFrom) {
      items = items.filter((t) => t.dateValidite >= q.dateFrom!);
    }
    if (q.dateTo) {
      items = items.filter((t) => t.dateValidite <= q.dateTo!);
    }

    const sortBy = q.sortBy ?? 'dateValidite';
    const dir = q.sortDirection === 'asc' ? 1 : -1;
    items.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortBy];
      const bv = (b as unknown as Record<string, unknown>)[sortBy];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });

    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<TauxChange> {
    const codeById = await this.loadCurrencyCodes();
    const row = await this.get<ExchangeRate>(`${this.basePath}/${id}`);
    return exchangeRateToTauxChange(row, codeById);
  }

  override async create(data: TauxChangeCreate): Promise<TauxChange> {
    const codeById = await this.loadCurrencyCodes();
    const row = await this.post<ExchangeRate>(this.basePath, tauxChangeToExchangeRateCreate(data));
    this.currencyCodes = null;
    return exchangeRateToTauxChange(row, codeById);
  }

  override async update(id: string | number, data: TauxChangeUpdate): Promise<TauxChange> {
    const codeById = await this.loadCurrencyCodes();
    const row = await this.put<ExchangeRate>(
      `${this.basePath}/${id}`,
      tauxChangeToExchangeRateUpdate(data),
    );
    return exchangeRateToTauxChange(row, codeById);
  }

  /** BAM batch import from Bank Al-Maghrib quotations. */
  async importFromBam(): Promise<TauxChange[]> {
    const codeById = await this.loadCurrencyCodes();
    const rows = await this.post<ExchangeRate[]>(`${this.basePath}/import-bam`, {});
    this.currencyCodes = null;
    return rows.map((row) => exchangeRateToTauxChange(row, codeById));
  }
}
