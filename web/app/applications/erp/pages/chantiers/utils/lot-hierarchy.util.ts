import type { LotChantier, PosteBudgetaire } from '@applications/erp/chantiers/models';

export type LotHierarchyRowKind = 'lot' | 'sousLot' | 'poste';

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

export function buildLotHierarchyRows(
  lots: LotChantier[],
  postesByLotId: Record<string, PosteBudgetaire[]>,
): LotHierarchyRow[] {
  const out: LotHierarchyRow[] = [];
  const rootLots = sortByOrdreCode(lots.filter((lot) => !lot.parentLotId));

  for (const lot of rootLots) {
    out.push({ kind: 'lot', depth: 0, lot });
    appendPostes(out, postesByLotId[lot.id] ?? [], 1);

    const sousLots = sortByOrdreCode(lots.filter((child) => child.parentLotId === lot.id));
    for (const sousLot of sousLots) {
      out.push({ kind: 'sousLot', depth: 1, lot: sousLot });
      appendPostes(out, postesByLotId[sousLot.id] ?? [], 2);
    }
  }

  return out;
}
