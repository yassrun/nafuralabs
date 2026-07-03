/** Dot-path read for document totals / status (e.g. `header.total`). */
export function getValueAtPath(obj: unknown, path: string): unknown {
  if (obj == null || !path) return undefined;
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const key of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}
