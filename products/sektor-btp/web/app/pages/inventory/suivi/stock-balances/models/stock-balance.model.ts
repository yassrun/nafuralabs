/**
 * StockBalance Model — aligned with stock raffinement (location_id).
 */

export interface StockBalance {
  id: string;
  locationId: string;
  /** @deprecated use locationId */
  warehouseId?: string;
  itemId: string;
  quantity: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  lastCountDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type StockBalanceListItem = Pick<
  StockBalance,
  'id' | 'locationId' | 'itemId' | 'quantity' | 'reservedQuantity' | 'availableQuantity' | 'createdAt' | 'updatedAt'
>;

export type StockBalanceCreate = Omit<StockBalance, 'id' | 'createdAt' | 'updatedAt' | 'availableQuantity' | 'warehouseId'>;

export type StockBalanceUpdate = Partial<StockBalanceCreate>;

export interface ItemQuantityAggregate {
  itemId: string;
  totalQuantity: number;
}

export interface StockBalanceQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  locationId?: string;
  itemId?: string;
  quantity?: number;
}
