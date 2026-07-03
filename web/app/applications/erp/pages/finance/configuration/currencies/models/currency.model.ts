/**
 * Currency Model — Auto-generated from currency.entity.json
 * Do NOT edit fields here. Edit the .entity.json and regenerate.
 */

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol?: string;
  decimalPlaces: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CurrencyListItem = Pick<Currency,
  'id' | 'code' | 'name' | 'symbol' | 'decimalPlaces' | 'isActive' | 'createdAt' | 'updatedAt'
>;

export type CurrencyCreate = Omit<Currency, 'id' | 'createdAt' | 'updatedAt'>;

export type CurrencyUpdate = Partial<CurrencyCreate>;

export interface CurrencyQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  code?: string;
  name?: string;
}
