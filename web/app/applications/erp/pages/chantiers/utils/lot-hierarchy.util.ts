import type { LotChantier, PosteBudgetaire } from '@applications/erp/chantiers/models';

export type LotHierarchyRowKind = 'lot' | 'sousLot' | 'poste';

/** Max depth for grouping lots (0 = root … 2 = sous-sous-lot). */
export const MAX_LOT_DEPTH = 2;

export interface LotHierarchyRow {
  kind: LotHierarchyRowKind;
  depth: number;
  lot?: LotChantier;
  poste?: PosteBudgetaire;
}

function sortByOrdreCode<T extends { ordre: number; code: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.ordre - b.ordre || a.code.localeCompare(b.code));
}

function appendPostes(
  out: LotHierarchyRow[],
  postes: PosteBudgetaire[],
  depth: number,
): void {
  for (const poste of sortByOrdreCode(postes)) {
    out.push({ kind: 'poste', depth, poste });
  }
}

export function lotDepth(lot: LotChantier, lotsById: Map<string, LotChantier>): number {
  let depth = 0;
  let currentParentId = lot.parentLotId ?? null;
  while (currentParentId) {
    depth += 1;
    if (depth > MAX_LOT_DEPTH) break;
    currentParentId = lotsById.get(currentParentId)?.parentLotId ?? null;
  }
  return depth;
}

export function buildLotHierarchyRows(
  lots: LotChantier[],
  postesByLotId: Record<string, PosteBudgetaire[]>,
): LotHierarchyRow[] {
  const out: LotHierarchyRow[] = [];
  const byParent = new Map<string | null, LotChantier[]>();
  for (const lot of lots) {
    const key = lot.parentLotId ?? null;
    const bucket = byParent.get(key) ?? [];
    bucket.push(lot);
    byParent.set(key, bucket);
  }
  for (const [, bucket] of byParent) {
    sortByOrdreCode(bucket);
  }

  function walk(parentId: string | null, depth: number): void {
    const siblings = byParent.get(parentId) ?? [];
    for (const lot of siblings) {
      const kind: LotHierarchyRowKind = depth === 0 ? 'lot' : 'sousLot';
      out.push({ kind, depth, lot });
      appendPostes(out, postesByLotId[lot.id] ?? [], depth + 1);
      if (depth < MAX_LOT_DEPTH) {
        walk(lot.id, depth + 1);
      }
    }
  }

  walk(null, 0);
  return out;
}
