import type { UiTreeConfig } from '../../doc-extractor/models/ui-schema.model';
import type { FieldIssue } from '../../doc-extractor/models/extraction.model';
import type { SmartImportRowStatus } from '../models/smart-import.model';

export interface SmartImportTreeNode {
  /** Absolute JSON path, e.g. lots[0].sousLots[1].postes[2] */
  path: string;
  /** Index of the top-level session row (lot parent). */
  rootIndex: number;
  depth: number;
  levelKey: string;
  levelLabel: string;
  data: Record<string, unknown>;
  /** Parent object holding this node in its children array (null for root). */
  parent: Record<string, unknown> | null;
  /** Property name on parent that holds this node. */
  parentArrayKey: string | null;
  indexInParent: number;
  expandable: boolean;
  issues: FieldIssue[];
  status: SmartImportRowStatus;
}

export function flattenSmartImportTree(args: {
  rows: Array<{ data: Record<string, unknown>; status: SmartImportRowStatus; issues: FieldIssue[] }>;
  tree: UiTreeConfig;
  allIssues?: FieldIssue[];
}): SmartImportTreeNode[] {
  const { rows, tree, allIssues = [] } = args;
  const out: SmartImportTreeNode[] = [];

  rows.forEach((row, rootIndex) => {
    const rootPath = `${tree.path}[${rootIndex}]`;
    walk({
      item: row.data,
      path: rootPath,
      rootIndex,
      depth: 0,
      levelKey: tree.path,
      parent: null,
      parentArrayKey: null,
      indexInParent: rootIndex,
      tree,
      rowStatus: row.status,
      rowIssues: row.issues,
      allIssues,
      out,
    });
  });

  return out;
}

function walk(args: {
  item: Record<string, unknown>;
  path: string;
  rootIndex: number;
  depth: number;
  levelKey: string;
  parent: Record<string, unknown> | null;
  parentArrayKey: string | null;
  indexInParent: number;
  tree: UiTreeConfig;
  rowStatus: SmartImportRowStatus;
  rowIssues: FieldIssue[];
  allIssues: FieldIssue[];
  out: SmartImportTreeNode[];
}): void {
  const {
    item,
    path,
    rootIndex,
    depth,
    levelKey,
    parent,
    parentArrayKey,
    indexInParent,
    tree,
    rowStatus,
    rowIssues,
    allIssues,
    out,
  } = args;

  const nodeIssues = collectIssuesForPath(path, [...rowIssues, ...allIssues]);
  const hasChildArrays = tree.childrenPaths.some((key) => {
    const value = item[key];
    return Array.isArray(value) && value.length > 0;
  });

  let status: SmartImportRowStatus = rowStatus;
  if (rowStatus === 'IGNORED' || rowStatus === 'DUPLICATE') {
    status = rowStatus;
  } else if (nodeIssues.length > 0 || hasDescendantIssues(path, [...rowIssues, ...allIssues], tree)) {
    status = 'NEEDS_REVIEW';
  } else {
    status = 'READY';
  }

  out.push({
    path,
    rootIndex,
    depth,
    levelKey,
    levelLabel: tree.levelLabels?.[levelKey] ?? levelKey,
    data: item,
    parent,
    parentArrayKey,
    indexInParent,
    expandable: hasChildArrays,
    issues: nodeIssues,
    status,
  });

  for (const childKey of tree.childrenPaths) {
    const children = item[childKey];
    if (!Array.isArray(children)) continue;
    children.forEach((child, index) => {
      if (!child || typeof child !== 'object' || Array.isArray(child)) return;
      walk({
        item: child as Record<string, unknown>,
        path: `${path}.${childKey}[${index}]`,
        rootIndex,
        depth: depth + 1,
        levelKey: childKey,
        parent: item,
        parentArrayKey: childKey,
        indexInParent: index,
        tree,
        rowStatus,
        rowIssues,
        allIssues,
        out,
      });
    });
  }
}

function collectIssuesForPath(nodePath: string, issues: FieldIssue[]): FieldIssue[] {
  return issues.filter((issue) => {
    const p = issue.path ?? '';
    if (!p) return false;
    // Own fields: lots[0].code or exact node path (missing object)
    if (p === nodePath) return true;
    if (!p.startsWith(nodePath + '.')) return false;
    const rest = p.slice(nodePath.length + 1);
    // Direct field on this node (no further [index] segment for child arrays)
    return !/\w+\[\d+\]/.test(rest);
  });
}

function hasDescendantIssues(
  nodePath: string,
  issues: FieldIssue[],
  tree: UiTreeConfig,
): boolean {
  return issues.some((issue) => {
    const p = issue.path ?? '';
    if (!p.startsWith(nodePath + '.')) return false;
    return tree.childrenPaths.some((key) => p.includes(`.${key}[`));
  });
}

/** Get value at a simple dotted path relative to an object (no array indexes). */
export function getRelativeValue(data: Record<string, unknown>, path: string): unknown {
  if (!path) return undefined;
  const parts = path.split('.');
  let cur: unknown = data;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object' || Array.isArray(cur)) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/**
 * Apply patched scalar/object fields onto a tree node, preserving child arrays.
 */
export function mergeNodeData(
  target: Record<string, unknown>,
  patch: Record<string, unknown>,
  childrenPaths: string[],
): void {
  const preserve = new Set(childrenPaths);
  for (const [key, value] of Object.entries(patch)) {
    if (preserve.has(key)) continue;
    target[key] = value;
  }
}
