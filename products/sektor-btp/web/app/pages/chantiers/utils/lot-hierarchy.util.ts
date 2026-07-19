import type { LotChantier, PosteBudgetaire } from '@applications/erp/chantiers/models';
import type { NfTreeNode } from '@lib/anatomy/components';

export type LotHierarchyRowKind = 'lot' | 'sousLot' | 'poste';

export interface LotHierarchyRow {
  kind: LotHierarchyRowKind;
  depth: number;
  lot?: LotChantier;
  poste?: PosteBudgetaire;
}

export function sortByOrdreCode<T extends { ordre: number; code: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.ordre - b.ordre || a.code.localeCompare(b.code));
}

export function buildLotHierarchyRows(
  lots: LotChantier[],
  postesByLotId: Record<string, PosteBudgetaire[]>,
): LotHierarchyRow[] {
  const out: LotHierarchyRow[] = [];
  const childrenByParent = groupLotsByParent(lots);

  const appendLot = (lot: LotChantier, depth: number): void => {
    out.push({ kind: depth === 0 ? 'lot' : 'sousLot', depth, lot });
    for (const poste of sortByOrdreCode(postesByLotId[lot.id] ?? [])) {
      out.push({ kind: 'poste', depth: depth + 1, poste });
    }
    for (const child of childrenByParent.get(lot.id) ?? []) {
      appendLot(child, depth + 1);
    }
  };

  for (const root of childrenByParent.get(null) ?? []) {
    appendLot(root, 0);
  }

  return out;
}

export function buildLotTreeNodes(
  lots: LotChantier[],
  postesByLotId: Record<string, PosteBudgetaire[]>,
): NfTreeNode<LotHierarchyRow>[] {
  const childrenByParent = groupLotsByParent(lots);

  const buildLotNode = (lot: LotChantier, depth: number): NfTreeNode<LotHierarchyRow> => {
    const posteNodes: NfTreeNode<LotHierarchyRow>[] =
      sortByOrdreCode(postesByLotId[lot.id] ?? []).map((poste) => ({
        key: `poste-${poste.id}`,
        data: { kind: 'poste', depth: depth + 1, poste },
        leaf: true,
      }));
    const childLotNodes = (childrenByParent.get(lot.id) ?? [])
      .map((child) => buildLotNode(child, depth + 1));
    const children = [...posteNodes, ...childLotNodes];

    return {
      key: `lot-${lot.id}`,
      data: { kind: depth === 0 ? 'lot' : 'sousLot', depth, lot },
      children,
      expanded: true,
      leaf: children.length === 0,
    };
  };

  return (childrenByParent.get(null) ?? []).map((root) => buildLotNode(root, 0));
}

function groupLotsByParent(lots: LotChantier[]): Map<string | null, LotChantier[]> {
  const grouped = new Map<string | null, LotChantier[]>();
  for (const lot of lots) {
    const parentId = lot.parentLotId ?? null;
    const children = grouped.get(parentId) ?? [];
    children.push(lot);
    grouped.set(parentId, children);
  }
  for (const [parentId, children] of grouped) {
    grouped.set(parentId, sortByOrdreCode(children));
  }
  return grouped;
}
