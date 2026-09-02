import type { NfTreeNode } from '@platform/lib/anatomy/components';
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
  coutUnitaire?: number | null;
  fraisGenerauxPercent?: number | null;
  margePercent?: number | null;
  total?: number | null;
  /** Nombre d'articles descendants (lots / sous-lots) — phase structure. */
  nombrePostes?: number | null;
  descriptif?: string | null;
  mode?: string | null;
  origineCout?: string | null;
  estimationSaisieEn?: string | null;
  coutDeduit?: boolean;
  forfaitPartnerId?: string | null;
  forfaitOffreId?: string | null;
  prixDpuId?: string | null;
  depth: number;
  /** ARTICLE sans unité ou quantité ≤ 0 — à corriger, reste dans l’arbre. */
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
        prixFourniBase: n.coutUnitaire ?? n.prixFourniBase,
        coutUnitaire: n.coutUnitaire ?? n.prixFourniBase,
        fraisGenerauxPercent: n.fraisGenerauxPercent,
        margePercent: n.margePercent,
        total: n.total,
        descriptif: n.descriptif,
        mode: n.mode,
        origineCout: n.origineCout,
        estimationSaisieEn: n.estimationSaisieEn,
        coutDeduit: n.coutDeduit,
        forfaitPartnerId: n.forfaitPartnerId,
        forfaitOffreId: n.forfaitOffreId,
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

/** Compte les articles descendants par lot / sous-lot (phase structure, hors prix). */
export function applyTreeRollupPostes(nodes: NfTreeNode<BordereauTreeRow>[]): void {
  const countNode = (node: NfTreeNode<BordereauTreeRow>): number => {
    if (node.data.type === 'ARTICLE') {
      node.data.nombrePostes = null;
      return 1;
    }
    const n = (node.children ?? []).reduce((sum, child) => sum + countNode(child), 0);
    node.data.nombrePostes = n;
    return n;
  };
  nodes.forEach(countNode);
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

/** Clés des articles marqués « incomplet » (unité / quantité). */
export function collectNonExploitableArticleKeys(
  nodes: NfTreeNode<BordereauTreeRow>[],
): string[] {
  const keys: string[] = [];
  const walk = (list: NfTreeNode<BordereauTreeRow>[]) => {
    for (const node of list) {
      if (node.data.type === 'ARTICLE' && node.data.nonExploitable) {
        keys.push(node.key);
      }
      if (node.children?.length) walk(node.children);
    }
  };
  walk(nodes);
  return keys;
}

function normalizeArticleCode(code: string | null | undefined): string {
  return (code ?? '').trim().toLowerCase();
}

export function findRowById(
  nodes: NfTreeNode<BordereauTreeRow>[],
  id: string,
): BordereauTreeRow | null {
  for (const node of nodes) {
    if (node.data.id === id) return node.data;
    if (node.children?.length) {
      const found = findRowById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** Premier nœud dont le code article correspond (insensible à la casse). */
export function findRowByCode(
  nodes: NfTreeNode<BordereauTreeRow>[],
  code: string,
): BordereauTreeRow | null {
  const wanted = normalizeArticleCode(code);
  if (!wanted) return null;
  let fallback: BordereauTreeRow | null = null;
  const walk = (list: NfTreeNode<BordereauTreeRow>[]): BordereauTreeRow | null => {
    for (const node of list) {
      if (normalizeArticleCode(node.data.code) === wanted) {
        if (node.data.type === 'ARTICLE') return node.data;
        fallback ??= node.data;
      }
      if (node.children?.length) {
        const found = walk(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(nodes) ?? fallback;
}

/** UUID persisté, sinon code affiché (brouillon d’extraction sans id). */
export function findFocusRow(
  nodes: NfTreeNode<BordereauTreeRow>[],
  id?: string | null,
  code?: string | null,
): BordereauTreeRow | null {
  if (id) {
    const byId = findRowById(nodes, id);
    if (byId) return byId;
  }
  if (code) return findRowByCode(nodes, code);
  return null;
}

/** Ancêtres à déplier pour rendre `targetKey` visible. */
export function expandAncestors(
  nodes: NfTreeNode<BordereauTreeRow>[],
  targetKey: string,
): Set<string> {
  const keys = new Set<string>();
  const walk = (list: NfTreeNode<BordereauTreeRow>[], trail: string[]): boolean => {
    for (const node of list) {
      const next = [...trail, node.key];
      if (node.key === targetKey) {
        trail.forEach((k) => keys.add(k));
        return true;
      }
      if (node.children?.length && walk(node.children, next)) {
        keys.add(node.key);
        return true;
      }
    }
    return false;
  };
  walk(nodes, []);
  return keys;
}

/** Déplie uniquement le chemin jusqu’aux articles incomplets (pas tout l’arbre). */
export function expandAncestorsOfNonExploitable(
  nodes: NfTreeNode<BordereauTreeRow>[],
): Set<string> {
  const keys = new Set<string>();
  for (const target of collectNonExploitableArticleKeys(nodes)) {
    for (const k of expandAncestors(nodes, target)) keys.add(k);
  }
  return keys;
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

/** Toutes les clés dépliables — étape Coût : tout l’arbre reste visible. */
export function collectAllExpandableKeys(nodes: NfTreeNode<BordereauTreeRow>[]): Set<string> {
  const keys = new Set<string>();
  const walk = (list: NfTreeNode<BordereauTreeRow>[]) => {
    for (const node of list) {
      if (node.children?.length) {
        keys.add(node.key);
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return keys;
}

/**
 * Garde uniquement les articles dont l’id est dans `allowed`, plus leurs ancêtres.
 * Un filtre trop étroit (ex. seul l’article déjà décomposé) fait disparaître les frères.
 */
export function filterTreeByArticleIds(
  nodes: NfTreeNode<BordereauTreeRow>[],
  allowed: Set<string>,
): NfTreeNode<BordereauTreeRow>[] {
  const out: NfTreeNode<BordereauTreeRow>[] = [];
  for (const node of nodes) {
    const children = node.children?.length
      ? filterTreeByArticleIds(node.children, allowed)
      : [];
    const keepArticle =
      node.data.type === 'ARTICLE' && node.data.id != null && allowed.has(node.data.id);
    if (keepArticle || children.length) {
      out.push({
        ...node,
        children: children.length ? children : undefined,
        leaf: !children.length,
      });
    }
  }
  return out;
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

/**
 * Plancher CSS de l’arbre : colonnes fixes + libellé (60 % de 12 rem).
 * Au-dessus, le libellé s’ellipse ; en-dessous, scroll H + sticky à droite.
 */
export function bordereauTableMinWidth(opts: {
  selection: boolean;
  structureActions: boolean;
}): string {
  const typeW = opts.selection ? 3.75 : 4.25;
  const codeW = opts.selection ? 5 : 5.5;
  const extraMetrics = opts.selection ? 10.75 : 4.5;
  const actionsW = opts.structureActions ? 8.5 : 0;
  return `${typeW + codeW + 7.2 + 4.25 + 4.5 + extraMetrics + actionsW}rem`;
}
