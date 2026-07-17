import { buildLotHierarchyRows, lotDepth, MAX_LOT_DEPTH } from './lot-hierarchy.util';
import type { LotChantier, PosteBudgetaire } from '@applications/erp/chantiers/models';

describe('lot-hierarchy.util', () => {
  const lot = (
    id: string,
    code: string,
    ordre: number,
    parentLotId?: string,
  ): LotChantier => ({
    id,
    chantierId: 'ch-1',
    code,
    designation: code,
    parentLotId,
    avancementPercent: 0,
    ordre,
  });

  const poste = (id: string, lotId: string, code: string): PosteBudgetaire => ({
    id,
    lotId,
    code,
    designation: code,
    ordre: 1,
  });

  it('builds four display levels: L1 → L2 → L3 → poste', () => {
    const lots = [
      lot('l1', '01', 1),
      lot('l2', '01-01', 2, 'l1'),
      lot('l3', '01-01-01', 3, 'l2'),
    ];
    const postesByLotId = {
      l3: [poste('p1', 'l3', '01')],
    };

    const rows = buildLotHierarchyRows(lots, postesByLotId);

    expect(rows.map((row) => [row.kind, row.depth, row.lot?.id ?? row.poste?.id])).toEqual([
      ['lot', 0, 'l1'],
      ['sousLot', 1, 'l2'],
      ['sousLot', 2, 'l3'],
      ['poste', 3, 'p1'],
    ]);
    expect(MAX_LOT_DEPTH).toBe(2);
  });

  it('attaches postes to any lot depth', () => {
    const lots = [lot('l1', '01', 1), lot('l2', '01-01', 2, 'l1')];
    const postesByLotId = {
      l1: [poste('p-root', 'l1', '01')],
      l2: [poste('p-child', 'l2', '01')],
    };

    const rows = buildLotHierarchyRows(lots, postesByLotId);

    expect(rows).toEqual([
      jasmine.objectContaining({ kind: 'lot', depth: 0, lot: jasmine.objectContaining({ id: 'l1' }) }),
      jasmine.objectContaining({ kind: 'poste', depth: 1, poste: jasmine.objectContaining({ id: 'p-root' }) }),
      jasmine.objectContaining({ kind: 'sousLot', depth: 1, lot: jasmine.objectContaining({ id: 'l2' }) }),
      jasmine.objectContaining({ kind: 'poste', depth: 2, poste: jasmine.objectContaining({ id: 'p-child' }) }),
    ]);
  });

  it('computes lot depth from parent chain', () => {
    const lots = [lot('l1', '01', 1), lot('l2', '01-01', 2, 'l1'), lot('l3', '01-01-01', 3, 'l2')];
    const byId = new Map(lots.map((item) => [item.id, item]));

    expect(lotDepth(lots[0], byId)).toBe(0);
    expect(lotDepth(lots[1], byId)).toBe(1);
    expect(lotDepth(lots[2], byId)).toBe(2);
  });
});
