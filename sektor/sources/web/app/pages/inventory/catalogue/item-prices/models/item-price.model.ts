/**
 * ItemPrice Model — Auto-generated from item-price.entity.json
 * Do NOT edit fields here. Edit the .entity.json and regenerate.
 */

export interface ItemPrice {
  id: string;
  itemId: string;
  priceType: string;
  currencyId: string;
  unitPrice: number;
  minQuantity?: number;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export type ItemPriceListItem = Pick<ItemPrice,
  'id' | 'itemId' | 'priceType' | 'currencyId' | 'unitPrice' | 'minQuantity' | 'effectiveFrom' | 'effectiveTo' | 'createdAt' | 'updatedAt'
>;

export type ItemPriceCreate = Omit<ItemPrice, 'id' | 'createdAt' | 'updatedAt'>;

export type ItemPriceUpdate = Partial<ItemPriceCreate>;

export interface ItemPriceQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  priceType?: string;
  currencyId?: string;
}
