import type { InventaireLine, InventaireTx, InventoryTx, InventoryTxLine } from '../models';
import type { InventoryTxLineInputDto, InventoryTxWithLinesBody } from './inventory-tx-api.types';

/** API row shape (header + optional denormalized fields). */
export interface ApiInventoryTxRow {
  id: string;
  txNumber: string;
  txType: string;
  warehouseId: string;
  txDate: string;
  reference?: string;
  status?: string;
  notes?: string;
  sourceLocationId?: string;
  destLocationId?: string;
  fournisseurId?: string;
  chantierLocationId?: string;
  chantierBudgetId?: string;
  phaseRef?: string;
  motifId?: string;
  bcId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiInventoryTxLineRow {
  id: string;
  inventoryTxId: string;
  lineNumber: number;
  itemId: string;
  quantity: number;
  theoreticalQty?: number;
  countedQty?: number;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
}

export interface ApiInventoryTxDetail {
  tx: ApiInventoryTxRow;
  lines: ApiInventoryTxLineRow[];
}

export function apiDetailToInventoryTx(
  detail: ApiInventoryTxDetail,
  enrich?: {
    locationName?: (id?: string) => string | undefined;
    fournisseurName?: (id?: string) => string | undefined;
    motifName?: (id?: string) => string | undefined;
  },
): InventoryTx {
  const { tx, lines } = detail;
  return {
    id: tx.id,
    txNumber: tx.txNumber,
    txType: tx.txType as InventoryTx['txType'],
    txDate: tx.txDate,
    status: tx.status ?? 'BROUILLON',
    reference: tx.reference,
    notes: tx.notes,
    fournisseurId: tx.fournisseurId,
    fournisseurName: enrich?.fournisseurName?.(tx.fournisseurId),
    sourceLocationId: tx.sourceLocationId,
    sourceLocationName: enrich?.locationName?.(tx.sourceLocationId),
    destLocationId: tx.destLocationId,
    destLocationName: enrich?.locationName?.(tx.destLocationId),
    chantierLocationId: tx.chantierLocationId,
    chantierBudgetId: tx.chantierBudgetId,
    phaseRef: tx.phaseRef,
    motifId: tx.motifId,
    motifName: enrich?.motifName?.(tx.motifId),
    bcId: tx.bcId,
    lines: lines.map((l) => apiLineToUiLine(l, tx.id)),
  };
}

export function apiLineToUiLine(row: ApiInventoryTxLineRow, txId: string): InventoryTxLine {
  return {
    id: row.id,
    txId,
    lineNumber: row.lineNumber,
    articleId: row.itemId,
    quantity: Number(row.quantity ?? 0),
    uomId: '',
    unitPrice: row.unitPrice != null ? Number(row.unitPrice) : undefined,
    totalPrice: row.totalPrice != null ? Number(row.totalPrice) : undefined,
    notes: row.notes,
  };
}

export function uiTxToWithLinesBody(tx: Partial<InventoryTx>): InventoryTxWithLinesBody {
  const destId = tx.destLocationId ?? tx.chantierLocationId;
  const sourceId = tx.sourceLocationId ?? tx.chantierLocationId;
  const txType = tx.txType ?? '';
  let warehouseId = destId ?? sourceId;
  if (txType === 'SORTIE' || txType === 'PERTE') {
    warehouseId = sourceId ?? destId;
  } else if (txType === 'RECEPTION' || txType === 'RETOUR') {
    warehouseId = destId ?? sourceId;
  } else if (txType === 'TRANSFERT') {
    warehouseId = sourceId ?? destId;
  }
  return {
    txNumber: tx.txNumber,
    txType,
    txDate: tx.txDate,
    reference: tx.reference,
    notes: tx.notes,
    warehouseId,
    sourceLocationId: sourceId,
    destLocationId: destId,
    fournisseurId: tx.fournisseurId,
    chantierLocationId: tx.chantierLocationId,
    chantierBudgetId: tx.chantierBudgetId,
    phaseRef: tx.phaseRef,
    motifId: tx.motifId,
    bcId: tx.bcId,
    lines: (tx.lines ?? []).map(uiLineToInput),
  };
}

export function apiDetailToInventaireTx(
  detail: ApiInventoryTxDetail,
  enrich?: Parameters<typeof apiDetailToInventoryTx>[1],
): InventaireTx {
  const lines = detail.lines.map((l) => apiLineToInventaireLine(l, detail.tx.id));
  const base = apiDetailToInventoryTx(detail, enrich);
  return {
    ...base,
    txType: 'INVENTAIRE',
    lines,
    totalVariance: lines.reduce((acc, l) => acc + l.variance, 0),
  };
}

export function apiLineToInventaireLine(row: ApiInventoryTxLineRow, txId: string): InventaireLine {
  const theoreticalQty = Number(row.theoreticalQty ?? row.quantity ?? 0);
  const countedQty = Number(row.countedQty ?? row.quantity ?? 0);
  return {
    ...apiLineToUiLine(row, txId),
    theoreticalQty,
    countedQty,
    variance: countedQty - theoreticalQty,
    quantity: countedQty,
  };
}

function uiLineToInput(line: InventoryTxLine): InventoryTxLineInputDto {
  const inv = line as InventaireLine;
  const countedQty = inv.countedQty ?? line.quantity;
  const theoreticalQty = inv.theoreticalQty ?? line.quantity;
  return {
    id: line.id,
    lineNumber: line.lineNumber,
    itemId: line.articleId,
    quantity: countedQty,
    theoreticalQty,
    countedQty,
    unitPrice: line.unitPrice,
    totalPrice:
      line.totalPrice ??
      (line.unitPrice != null ? Math.round(countedQty * line.unitPrice * 100) / 100 : undefined),
    notes: line.notes,
  };
}
