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
  depth: number;
}

export interface ImportNoeudPreview {
  type?: string;
  code?: string;
  libelle?: string;
  unite?: string | null;
  quantite?: number | null;
  enfants?: ImportNoeudPreview[];
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
        depth,
      },
      children,
    };
  });
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
