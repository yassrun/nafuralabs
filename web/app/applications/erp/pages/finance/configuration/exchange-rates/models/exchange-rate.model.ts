/**
 * ExchangeRate Model — Auto-generated from exchange-rate.entity.json
 * Do NOT edit fields here. Edit the .entity.json and regenerate.
 */

export interface ExchangeRate {
  id: string;
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: number;
  effectiveDate: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExchangeRateListItem = Pick<ExchangeRate,
  'id' | 'fromCurrencyId' | 'toCurrencyId' | 'rate' | 'effectiveDate' | 'source' | 'createdAt' | 'updatedAt'
>;

export type ExchangeRateCreate = Omit<ExchangeRate, 'id' | 'createdAt' | 'updatedAt'>;

export type ExchangeRateUpdate = Partial<ExchangeRateCreate>;

export interface ExchangeRateQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  fromCurrencyId?: string;
  toCurrencyId?: string;
  effectiveDate?: string;
  source?: string;
}
