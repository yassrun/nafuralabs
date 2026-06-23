/**
 * Safely get/set values in JSON-like objects using dotted paths.
 *
 * Supports:
 * - "sender.name"
 * - "items[0].sku"
 * - "items.0.sku"
 *
 * Also supports an optional future "confidence wrapper" per field:
 * if a leaf node looks like { value: X, confidence?: number }, getters will
 * return X by default.
 */
export class PathResolver {
  private static readonly bracketIndexRe = /\[(\d+)\]/g;

  static tokenize(path: string): Array<string | number> {
    const normalized = path
      .replaceAll(PathResolver.bracketIndexRe, '.$1')
      .split('.')
      .map(p => p.trim())
      .filter(Boolean);

    return normalized.map(seg => {
      const n = Number(seg);
      return Number.isInteger(n) && String(n) === seg ? n : seg;
    });
  }

  static get<T = unknown>(obj: unknown, path: string, fallback?: T): T {
    if (!path) return (obj as T) ?? (fallback as T);
    const tokens = PathResolver.tokenize(path);

    let cur: any = obj;
    for (const t of tokens) {
      if (cur === null || cur === undefined) return fallback as T;
      cur = cur[t as any];
    }

    // Optional future-proofing: unwrap {value, confidence}
    if (cur && typeof cur === 'object' && 'value' in (cur as any)) {
      return (cur as any).value as T;
    }
    return (cur as T) ?? (fallback as T);
  }

  /**
   * Mutates the target object to set a value at the given path.
   * Creates missing objects/arrays on the way down.
   */
  static set(obj: any, path: string, value: unknown): any {
    if (!path) return value;
    const tokens = PathResolver.tokenize(path);
    if (tokens.length === 0) return obj;

    let cur: any = obj;
    for (let i = 0; i < tokens.length - 1; i++) {
      const t = tokens[i]!;
      const next = tokens[i + 1]!;

      if (cur[t as any] === undefined || cur[t as any] === null) {
        cur[t as any] = typeof next === 'number' ? [] : {};
      }
      cur = cur[t as any];
    }

    const last = tokens[tokens.length - 1]!;
    cur[last as any] = value;
    return obj;
  }
}

