import type { LotChantier, PosteBudgetaire } from '@applications/erp/chantiers/models';

import { buildLotHierarchyRows, buildLotTreeNodes } from './lot-hierarchy.util';

describe('lot-hierarchy.util', () => {
  const lot = (
    id: string,
    code: string,
    ordre: number,
    parentLotId?: string,
  ): LotChantier => ({
    id,
    chantierId: 'chantier-1',
    code,
    designation: code,
    ordre,
    parentLotId,
    avancementPercent: 0,
  });

  const poste = (
    id: string,
    lotId: string,
    code: string,
    ordre: number,
  ): PosteBudgetaire => ({
    id,
    lotId,
    code,
    designation: code,
    ordre,
  });

  it('builds a recursive heterogeneous tree sorted by ordre and code', () => {
    const lots = [
      lot('root-b', 'L02', 2),
      lot('child', 'L01.01', 1, 'root-a'),
      lot('grandchild', 'L01.01.01', 1, 'child'),
      lot('root-a', 'L01', 1),
    ];
    const postes = {
      'root-a': [
        poste('p2', 'root-a', 'P02', 2),
        poste('p1', 'root-a', 'P01', 1),
      ],
      grandchild: [poste('p3', 'grandchild', 'P03', 1)],
    };

    const nodes = buildLotTreeNodes(lots, postes);

    expect(nodes.map((node) => node.key)).toEqual(['lot-root-a', 'lot-root-b']);
    expect(nodes[0].children?.map((node) => node.key)).toEqual([
      'poste-p1',
      'poste-p2',
      'lot-child',
    ]);
    expect(nodes[0].children?.[2].children?.[0].key).toBe('lot-grandchild');
    expect(nodes[0].children?.[2].children?.[0].children?.[0].key).toBe('poste-p3');
    expect(nodes[0].children?.[2].children?.[0].data.kind).toBe('sousLot');
  });

  it('keeps the flat compatibility view recursive', () => {
    const rows = buildLotHierarchyRows(
      [
        lot('root', 'L01', 1),
        lot('child', 'L01.01', 1, 'root'),
        lot('grandchild', 'L01.01.01', 1, 'child'),
      ],
      {},
    );

    expect(rows.map(({ kind, depth }) => `${kind}:${depth}`)).toEqual([
      'lot:0',
      'sousLot:1',
      'sousLot:2',
    ]);
  });
});
