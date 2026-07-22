import type { NfTreeNode } from '@lib/anatomy/components';
import type { NoeudDPGF } from '@app/etudes/models';

/** Ligne affichée dans nf-tree-table (aperçu import ou arbre persisté). */
export interface BordereauTreeRow {
  key: string;
  id?: string;
  /** Parent persisté (arbre DPGF) — pour add sibling / child via API. */
  parentId?: string | null;
  type: string;
  code: string;
  libelle: string;
  unite?: string | null;
  quantite?: number | null;
  prixUnitaire?: number | null;
  prixFourniBase?: number | null;
  fraisGenerauxPercent?: number | null;
  margePercent?: number | null;
  total?: number | null;
  descriptif?: string | null;
  mode?: string | null;
  prixDpuId?: string | null;
  depth: number;
  /** ARTICLE sans unité ou quantité ≤ 0 — exclu à la persistance. */
  nonExploitable?: boolean;
}

export interface ImportNoeudPreview {
  type?: string;
  code?: string;
  libelle?: string;
  unite?: string | null;
  quantite?: number | null;
  enfants?: ImportNoeudPreview[];
}

/** Aligné sur DpgfService.articleExploitable. */
export function isArticleExploitable(node: {
  type?: string | null;
  unite?: string | null;
  quantite?: number | null;
}): boolean {
  if ((node.type ?? 'ARTICLE').toUpperCase() !== 'ARTICLE') return true;
  if (!node.unite || !String(node.unite).trim()) return false;
  return node.quantite != null && Number(node.quantite) > 0;
}

export function countExploitableArticles(arbre: ImportNoeudPreview[]): number {
  let n = 0;
  const walk = (list: ImportNoeudPreview[]) => {
    for (const node of list ?? []) {
      const type = (node.type ?? 'ARTICLE').toUpperCase();
      if (type === 'ARTICLE' && isArticleExploitable({ type, unite: node.unite, quantite: node.quantite })) {
        n += 1;
      }
      if (node.enfants?.length) walk(node.enfants);
    }
  };
  walk(arbre);
  return n;
}

export function countIgnoredArticles(arbre: ImportNoeudPreview[]): number {
  let n = 0;
  const walk = (list: ImportNoeudPreview[]) => {
    for (const node of list ?? []) {
      const type = (node.type ?? 'ARTICLE').toUpperCase();
      if (type === 'ARTICLE' && !isArticleExploitable({ type, unite: node.unite, quantite: node.quantite })) {
        n += 1;
      }
      if (node.enfants?.length) walk(node.enfants);
    }
  };
  walk(arbre);
  return n;
}

export function noeudsDpgfToTreeNodes(
  noeuds: NoeudDPGF[],
  depth = 0,
  parentId: string | null = null,
): NfTreeNode<BordereauTreeRow>[] {
  return (noeuds ?? []).map((n, i) => {
    const key = n.id || `n-${depth}-${i}-${n.code}`;
    const children = n.enfants?.length
      ? noeudsDpgfToTreeNodes(n.enfants, depth + 1, n.id)
      : undefined;
    return {
      key,
      leaf: !children?.length,
      data: {
        key,
        id: n.id,
        parentId,
        type: n.type,
        code: n.code,
        libelle: n.libelle,
        unite: n.unite,
        quantite: n.quantite,
        prixUnitaire: n.prixUnitaire,
        prixFourniBase: n.prixFourniBase,
        fraisGenerauxPercent: n.fraisGenerauxPercent,
        margePercent: n.margePercent,
        total: n.total,
        descriptif: n.descriptif,
        mode: n.mode,
        prixDpuId: n.prixDpuId,
        depth,
        nonExploitable:
          n.type === 'ARTICLE' &&
          !isArticleExploitable({ type: n.type, unite: n.unite, quantite: n.quantite }),
      },
      children,
    };
  });
}

/** Calcule les totaux d’affichage des lots et sous-lots depuis leurs descendants. */
export function applyTreeRollupTotals(nodes: NfTreeNode<BordereauTreeRow>[]): void {
  const sumNode = (node: NfTreeNode<BordereauTreeRow>): number => {
    if (node.data.type === 'ARTICLE') return Number(node.data.total ?? 0);
    const total = (node.children ?? []).reduce((sum, child) => sum + sumNode(child), 0);
    node.data.total = Math.round(total * 100) / 100;
    return node.data.total;
  };
  nodes.forEach(sumNode);
}

export function importArbreToTreeNodes(
  noeuds: ImportNoeudPreview[],
  depth = 0,
  path = '',
): NfTreeNode<BordereauTreeRow>[] {
  return (noeuds ?? []).map((n, i) => {
    const key = `${path}/${depth}-${i}-${n.code ?? i}`;
    const type = (n.type ?? 'ARTICLE').toUpperCase();
    const children = n.enfants?.length
      ? importArbreToTreeNodes(n.enfants, depth + 1, key)
      : undefined;
    return {
      key,
      leaf: !children?.length,
      data: {
        key,
        type,
        code: n.code ?? String(i + 1),
        libelle: n.libelle ?? 'Sans libellé',
        unite: n.unite,
        quantite: n.quantite ?? null,
        depth,
        nonExploitable:
          type === 'ARTICLE' &&
          !isArticleExploitable({ type, unite: n.unite, quantite: n.quantite }),
      },
      children,
    };
  });
}

export function collectExpandKeys(nodes: NfTreeNode<BordereauTreeRow>[], maxDepth = 1): Set<string> {
  const keys = new Set<string>();
  const walk = (list: NfTreeNode<BordereauTreeRow>[]) => {
    for (const node of list) {
      if ((node.data.depth ?? 0) <= maxDepth && node.children?.length) {
        keys.add(node.key);
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return keys;
}

export function countArticlesInNodes(nodes: NfTreeNode<BordereauTreeRow>[]): number {
  let n = 0;
  const walk = (list: NfTreeNode<BordereauTreeRow>[]) => {
    for (const node of list) {
      if (node.data.type === 'ARTICLE') n++;
      if (node.children?.length) walk(node.children);
    }
  };
  walk(nodes);
  return n;
}

export function countExploitableInNodes(nodes: NfTreeNode<BordereauTreeRow>[]): number {
  let n = 0;
  const walk = (list: NfTreeNode<BordereauTreeRow>[]) => {
    for (const node of list) {
      if (node.data.type === 'ARTICLE' && !node.data.nonExploitable) n++;
      if (node.children?.length) walk(node.children);
    }
  };
  walk(nodes);
  return n;
}

/** Keys look like `/0-0-CODE/1-2-CODE` — recover numeric indices. */
export function importKeyToPath(key: string): number[] | null {
  const parts = key.split('/').filter(Boolean);
  const path: number[] = [];
  for (const part of parts) {
    const m = /^(\d+)-(\d+)-/.exec(part);
    if (!m) return null;
    path.push(Number(m[2]));
  }
  return path.length ? path : null;
}

export function getImportNoeudAt(
  root: ImportNoeudPreview[],
  path: number[],
): ImportNoeudPreview | null {
  let list = root;
  let node: ImportNoeudPreview | null = null;
  for (const idx of path) {
    node = list[idx] ?? null;
    if (!node) return null;
    list = node.enfants ?? [];
  }
  return node;
}
