/**
 * InventoryTx Model — Auto-generated from inventory-tx.entity.json
 * Do NOT edit fields here. Edit the .entity.json and regenerate.
 */

export interface InventoryTx {
  id: string;
  txNumber: string;
  txType: string;
  warehouseId: string;
  txDate: string;
  reference?: string;
  status?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryTxListItem = Pick<InventoryTx,
  'id' | 'txNumber' | 'txType' | 'warehouseId' | 'txDate' | 'reference' | 'status' | 'createdAt' | 'updatedAt'
>;

export type InventoryTxCreate = Omit<InventoryTx, 'id' | 'createdAt' | 'updatedAt'>;

export type InventoryTxUpdate = Partial<InventoryTxCreate>;

export interface InventoryTxQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  txNumber?: string;
  txType?: string;
  warehouseId?: string;
  txDate?: string;
  reference?: string;
  status?: string;
}
