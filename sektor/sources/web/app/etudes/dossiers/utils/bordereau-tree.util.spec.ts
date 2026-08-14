import type { NfTreeNode } from '@platform/lib/anatomy/components';

import {
  applyTreeRollupPostes,
  applyTreeRollupTotals,
  countExploitableArticles,
  countExploitableInNodes,
  countIgnoredArticles,
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

  it('récupère le chemin depuis une clé import', () => {
    expect(importKeyToPath('/0-0-1/1-2-ART')).toEqual([0, 2]);
    expect(importKeyToPath('invalid')).toBeNull();
  });
});
