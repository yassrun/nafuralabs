import type { LotChantier, PosteBudgetaire } from '@app/chantiers/models';
import type { NfTreeNode } from '@lib/anatomy/components';

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

/**
 * Builds nested tree nodes (lots → sous-lots → postes) for the generic
 * nf-tree-table. Mirrors buildLotHierarchyRows grouping and MAX_LOT_DEPTH.
 */
export function buildLotTreeNodes(
  lots: LotChantier[],
  postesByLotId: Record<string, PosteBudgetaire[]>,
): NfTreeNode<LotHierarchyRow>[] {
  const byParent = new Map<string | null, LotChantier[]>();
  for (const lot of lots) {
    const key = lot.parentLotId ?? null;
    const bucket = byParent.get(key) ?? [];
    bucket.push(lot);
    byParent.set(key, bucket);
  }

  function posteNodes(lotId: string, depth: number): NfTreeNode<LotHierarchyRow>[] {
    return sortByOrdreCode(postesByLotId[lotId] ?? []).map((poste) => ({
      key: `poste-${poste.id}`,
      data: { kind: 'poste', depth, poste },
      leaf: true,
    }));
  }

  function walk(parentId: string | null, depth: number): NfTreeNode<LotHierarchyRow>[] {
    const siblings = sortByOrdreCode(byParent.get(parentId) ?? []);
    return siblings.map((lot) => {
      const kind: LotHierarchyRowKind = depth === 0 ? 'lot' : 'sousLot';
      const children: NfTreeNode<LotHierarchyRow>[] = [
        ...posteNodes(lot.id, depth + 1),
      ];
      if (depth < MAX_LOT_DEPTH) {
        children.push(...walk(lot.id, depth + 1));
      }
      return {
        key: `lot-${lot.id}`,
        data: { kind, depth, lot },
        expanded: true,
        leaf: children.length === 0,
        children,
      };
    });
  }

  return walk(null, 0);
}
