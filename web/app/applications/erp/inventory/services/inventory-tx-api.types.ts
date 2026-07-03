export interface InventoryTxLineInputDto {
  id?: string;
  lineNumber?: number;
  itemId: string;
  quantity: number;
  theoreticalQty?: number;
  countedQty?: number;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
}

export interface InventoryTxWithLinesBody {
  txNumber?: string;
  txType: string;
  txDate?: string;
  reference?: string;
  notes?: string;
  warehouseId?: string;
  sourceLocationId?: string;
  destLocationId?: string;
  fournisseurId?: string;
  chantierLocationId?: string;
  chantierBudgetId?: string;
  phaseRef?: string;
  motifId?: string;
  bcId?: string;
  lines: InventoryTxLineInputDto[];
}

export interface InventoryTxWithLinesUpdateBody extends Partial<InventoryTxWithLinesBody> {}
