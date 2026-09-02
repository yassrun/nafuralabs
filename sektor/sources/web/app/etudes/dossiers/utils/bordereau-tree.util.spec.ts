import type { NfTreeNode } from '@platform/lib/anatomy/components';

import {
  applyTreeRollupPostes,
  applyTreeRollupTotals,
  bordereauTableMinWidth,
  countExploitableArticles,
  countExploitableInNodes,
  countIgnoredArticles,
  collectNonExploitableArticleKeys,
  collectAllExpandableKeys,
  expandAncestorsOfNonExploitable,
  filterTreeByArticleIds,
  findFocusRow,
  importArbreToTreeNodes,
  importKeyToPath,
  isArticleExploitable,
  type BordereauTreeRow,
  type ImportNoeudPreview,
} from './bordereau-tree.util';

describe('applyTreeRollupTotals', () => {
  it('agrège les articles dans les sous-lots et les lots', () => {
    const article = (key: string, total: number): NfTreeNode<BordereauTreeRow> => ({
      key,
      leaf: true,
      data: { key, type: 'ARTICLE', code: key, libelle: key, total, depth: 2 },
    });
    const sousLot: NfTreeNode<BordereauTreeRow> = {
      key: 'sl',
      leaf: false,
      data: { key: 'sl', type: 'SOUS_LOT', code: '1.1', libelle: 'Sous-lot', depth: 1 },
      children: [article('a1', 100.25), article('a2', 49.75)],
    };
    const lot: NfTreeNode<BordereauTreeRow> = {
      key: 'lot',
      leaf: false,
      data: { key: 'lot', type: 'LOT', code: '1', libelle: 'Lot', depth: 0 },
      children: [sousLot],
    };

    applyTreeRollupTotals([lot]);

    expect(sousLot.data.total).toBe(150);
    expect(lot.data.total).toBe(150);
  });
});

describe('applyTreeRollupPostes', () => {
  it('compte les articles descendants par lot / sous-lot', () => {
    const article = (key: string): NfTreeNode<BordereauTreeRow> => ({
      key,
      leaf: true,
      data: { key, type: 'ARTICLE', code: key, libelle: key, depth: 2 },
    });
    const sousLot: NfTreeNode<BordereauTreeRow> = {
      key: 'sl',
      leaf: false,
      data: { key: 'sl', type: 'SOUS_LOT', code: '1.1', libelle: 'Sous-lot', depth: 1 },
      children: [article('a1'), article('a2'), article('a3')],
    };
    const lot: NfTreeNode<BordereauTreeRow> = {
      key: 'lot',
      leaf: false,
      data: { key: 'lot', type: 'LOT', code: '1', libelle: 'Lot', depth: 0 },
      children: [sousLot, article('a4')],
    };

    applyTreeRollupPostes([lot]);

    expect(sousLot.data.nombrePostes).toBe(3);
    expect(lot.data.nombrePostes).toBe(4);
    expect(sousLot.children![0].data.nombrePostes).toBeNull();
  });
});

describe('article exploitable (aligné backend)', () => {
  it('exige unité non vide et quantité > 0', () => {
    expect(isArticleExploitable({ type: 'ARTICLE', unite: 'm2', quantite: 1 })).toBe(true);
    expect(isArticleExploitable({ type: 'ARTICLE', unite: '  ', quantite: 1 })).toBe(false);
    expect(isArticleExploitable({ type: 'ARTICLE', unite: 'm2', quantite: 0 })).toBe(false);
    expect(isArticleExploitable({ type: 'ARTICLE', unite: null, quantite: 2 })).toBe(false);
    expect(isArticleExploitable({ type: 'LOT', unite: null, quantite: null })).toBe(true);
  });

  it('compte exploitables vs ignorés sur un arbre mixte', () => {
    const arbre: ImportNoeudPreview[] = [
      {
        type: 'LOT',
        code: '1',
        libelle: 'Lot',
        enfants: [
          {
            type: 'ARTICLE',
            code: '1-1',
            libelle: 'OK',
            unite: 'm2',
            quantite: 10,
          },
          {
            type: 'ARTICLE',
            code: '1-2',
            libelle: 'TOTAL',
            unite: null,
            quantite: null,
          },
          {
            type: 'ARTICLE',
            code: '1-3',
            libelle: 'Sans qté',
            unite: 'u',
            quantite: 0,
          },
        ],
      },
    ];

    expect(countExploitableArticles(arbre)).toBe(1);
    expect(countIgnoredArticles(arbre)).toBe(2);

    const nodes = importArbreToTreeNodes(arbre);
    expect(countExploitableInNodes(nodes)).toBe(1);
    expect(nodes[0].children?.[1].data.nonExploitable).toBe(true);
  });

  it('déplie uniquement les ancêtres des articles incomplets', () => {
    const arbre: ImportNoeudPreview[] = [
      {
        type: 'LOT',
        code: '1',
        libelle: 'Terrassement',
        enfants: [
          {
            type: 'SOUS_LOT',
            code: 'A',
            libelle: 'Chapitre',
            enfants: [
              {
                type: 'ARTICLE',
                code: '1.1',
                libelle: 'OK',
                unite: 'm2',
                quantite: 10,
              },
            ],
          },
        ],
      },
      {
        type: 'LOT',
        code: '3',
        libelle: 'Électricité',
        enfants: [
          {
            type: 'SOUS_LOT',
            code: 'B',
            libelle: 'Appareillage',
            enfants: [
              {
                type: 'ARTICLE',
                code: '3.9.3',
                libelle: 'Sans qté',
                unite: 'u',
                quantite: 0,
              },
            ],
          },
        ],
      },
    ];
    const nodes = importArbreToTreeNodes(arbre);
    const expanded = expandAncestorsOfNonExploitable(nodes);
    const incompleteKeys = collectNonExploitableArticleKeys(nodes);

    expect(incompleteKeys.length).toBe(1);
    expect(expanded.has(nodes[0].key)).toBe(false);
    expect(expanded.has(nodes[1].key)).toBe(true);
    expect(expanded.has(nodes[1].children![0].key)).toBe(true);
  });

  it('cible un nœud d’extraction par code quand l’id persisté est absent', () => {
    const nodes = importArbreToTreeNodes([
      {
        type: 'LOT',
        code: 'a',
        libelle: 'Terrassement',
        enfants: [
          {
            type: 'ARTICLE',
            code: 'a/1',
            libelle: 'Déblais en masse terrain meuble',
            unite: 'm3',
            quantite: 0,
          },
        ],
      },
    ]);
    expect(findFocusRow(nodes, 'uuid-persiste', 'a/1')?.code).toBe('a/1');
    expect(findFocusRow(nodes, null, 'A/1')?.libelle).toContain('Déblais');
    expect(findFocusRow(nodes, 'uuid-persiste', null)).toBeNull();
  });

  it('récupère le chemin depuis une clé import', () => {
    expect(importKeyToPath('/0-0-1/1-2-ART')).toEqual([0, 2]);
    expect(importKeyToPath('invalid')).toBeNull();
  });
});

describe('filtre arbre Coût', () => {
  function article(id: string, code: string): NfTreeNode<BordereauTreeRow> {
    return {
      key: id,
      leaf: true,
      data: {
        key: id,
        id,
        type: 'ARTICLE',
        code,
        libelle: code,
        depth: 2,
      },
    };
  }

  const lot: NfTreeNode<BordereauTreeRow> = {
    key: 'lot6',
    leaf: false,
    data: { key: 'lot6', id: 'lot6', type: 'LOT', code: '6', libelle: 'REVETEMENTS', depth: 0 },
    children: [
      {
        key: 'sl61',
        leaf: false,
        data: {
          key: 'sl61',
          id: 'sl61',
          type: 'SOUS_LOT',
          code: '6.1',
          libelle: 'REVETEMENTS',
          depth: 1,
        },
        children: [
          article('a611', '6.1.1'),
          article('a612', '6.1.2'),
          article('a613', '6.1.3'),
        ],
      },
    ],
  };

  it('un filtre sur le seul article chiffré masque les frères — ne pas l’appliquer tel quel', () => {
    const filtered = filterTreeByArticleIds([lot], new Set(['a611']));
    const sl = filtered[0]?.children?.[0];
    expect(sl?.children?.map((c) => c.data.code)).toEqual(['6.1.1']);
  });

  it('déplie tout l’arbre pour l’étape Coût', () => {
    const keys = collectAllExpandableKeys([lot]);
    expect(keys.has('lot6')).toBe(true);
    expect(keys.has('sl61')).toBe(true);
    expect(keys.has('a611')).toBe(false);
  });
});

describe('bordereauTableMinWidth', () => {
  it('réserve le libellé et les métriques sans forcer 100%', () => {
    expect(bordereauTableMinWidth({ selection: false, structureActions: false }))
      .toBe('30.2rem');
    expect(bordereauTableMinWidth({ selection: false, structureActions: true }))
      .toBe('38.7rem');
  });
});
