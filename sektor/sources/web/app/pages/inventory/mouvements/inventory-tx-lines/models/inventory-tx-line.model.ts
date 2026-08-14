/**
 * InventoryTxLine Model — Auto-generated from inventory-tx-line.entity.json
 * Do NOT edit fields here. Edit the .entity.json and regenerate.
 */

export interface InventoryTxLine {
  id: string;
  inventoryTxId: string;
  lineNumber: number;
  itemId: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryTxLineListItem = Pick<InventoryTxLine,
  'id' | 'lineNumber' | 'itemId' | 'quantity' | 'unitPrice' | 'totalPrice' | 'createdAt' | 'updatedAt'
>;

export type InventoryTxLineCreate = Omit<InventoryTxLine, 'id' | 'createdAt' | 'updatedAt'>;

export type InventoryTxLineUpdate = Partial<InventoryTxLineCreate>;

export interface InventoryTxLineQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  itemId?: string;
  quantity?: number;
  unitPrice?: number;
}
