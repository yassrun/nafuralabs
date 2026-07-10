import type { ListResponse } from '@lib/anatomy/types';
import type { InventoryTx, InventoryTxLine } from '../models';
import type { InventoryMovementApiService, MovementEnrichers } from './inventory-movement-api.service';
import type { ApiInventoryTxRow } from './inventory-tx.mapper';

export function sumLineTotals(lines: InventoryTxLine[]): number {
  return lines.reduce(
    (acc, l) => acc + (l.totalPrice ?? (l.unitPrice != null ? l.quantity * l.unitPrice : 0)),
    0,
  );
}

export async function loadMovementPage<T extends InventoryTx>(
  movementApi: InventoryMovementApiService,
  txType: string,
  query: Record<string, unknown> | undefined,
  filterHeaders: (rows: ApiInventoryTxRow[]) => ApiInventoryTxRow[],
  mapItem: (tx: InventoryTx) => T,
  enrich?: MovementEnrichers,
): Promise<ListResponse<T>> {
  let rows = await movementApi.listHeadersByType(txType, { page: 0, pageSize: 500 });
  rows = filterHeaders(rows);

  const page = Number(query?.['page'] ?? 1);
  const pageSize = Number(query?.['pageSize'] ?? 20);
  const total = rows.length;
  const start = (page - 1) * pageSize;
  const slice = rows.slice(start, start + pageSize);

  const items = await Promise.all(
    slice.map(async (row) => {
      const tx = await movementApi.getDetail(row.id, enrich);
      return mapItem(tx);
    }),
  );

  return { items, total };
}
