import type { NfTreeNode } from '../tree-table';

function fieldValue(item: unknown, key: string): unknown {
  if (item == null || typeof item !== 'object') return undefined;
  return (item as Record<string, unknown>)[key];
}

export function matchesSearch(item: unknown, query: string, fields?: string[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (fields?.length) {
    return fields.some((f) => String(fieldValue(item, f) ?? '').toLowerCase().includes(q));
  }
  return JSON.stringify(item).toLowerCase().includes(q);
}

export function matchesFilters(item: unknown, filters: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    if (String(fieldValue(item, key) ?? '') !== String(value)) return false;
  }
  return true;
}

/** Keep matching nodes and ancestors. A match keeps the whole subtree. */
export function filterTreeNodes<T>(
  nodes: NfTreeNode<T>[],
  pred: (data: T) => boolean
): NfTreeNode<T>[] {
  const out: NfTreeNode<T>[] = [];
  for (const node of nodes) {
    if (pred(node.data)) {
      out.push(node);
      continue;
    }
    const children = node.children?.length ? filterTreeNodes(node.children, pred) : [];
    if (children.length) {
      out.push({ ...node, children });
    }
  }
  return out;
}

export function collectExpandableKeys<T>(nodes: NfTreeNode<T>[]): Set<string> {
  const keys = new Set<string>();
  const walk = (xs: NfTreeNode<T>[]) => {
    for (const n of xs) {
      if (n.children?.length && !n.leaf) {
        keys.add(n.key);
        walk(n.children);
      }
    }
  };
  walk(nodes);
  return keys;
}
