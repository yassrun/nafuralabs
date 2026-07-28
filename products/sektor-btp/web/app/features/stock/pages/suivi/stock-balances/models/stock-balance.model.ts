/**
 * StockBalance Model — Auto-generated from stock-balance.entity.json
 * Do NOT edit fields here. Edit the .entity.json and regenerate.
 */

export interface StockBalance {
  id: string;
  warehouseId: string;
  itemId: string;
  quantity: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  lastCountDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type StockBalanceListItem = Pick<StockBalance,
  'id' | 'warehouseId' | 'itemId' | 'quantity' | 'reservedQuantity' | 'availableQuantity' | 'createdAt' | 'updatedAt'
>;

export type StockBalanceCreate = Omit<StockBalance, 'id' | 'createdAt' | 'updatedAt'>;

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
  warehouseId?: string;
  itemId?: string;
  quantity?: number;
}
