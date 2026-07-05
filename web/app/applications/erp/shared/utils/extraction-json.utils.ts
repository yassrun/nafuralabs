export const DEFAULT_LINE_ALIASES = [
  'lines',
  'items',
  'lineItems',
  'articles',
  'produits',
  'details',
];

export function extractObject(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return extractObject(parsed);
    } catch {
      return {};
    }
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

export function findByAliases(root: unknown, aliases: string[]): unknown {
  const normalizedAliases = new Set(aliases.map((alias) => alias.toLowerCase()));

  const walk = (node: unknown): unknown => {
    if (!node || typeof node !== 'object') {
      return undefined;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        const found = walk(item);
        if (found !== undefined) {
          return found;
        }
      }
      return undefined;
    }

    const record = node as Record<string, unknown>;

    for (const [key, value] of Object.entries(record)) {
      if (normalizedAliases.has(key.toLowerCase()) && value != null) {
        return value;
      }
    }

    for (const value of Object.values(record)) {
      const found = walk(value);
      if (found !== undefined) {
        return found;
      }
    }

    return undefined;
  };

  return walk(root);
}

export function findStringByAliases(root: unknown, aliases: string[]): string | undefined {
  const raw = findByAliases(root, aliases);
  if (typeof raw !== 'string') {
    return undefined;
  }

  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeDate(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  const iso = isoPattern.exec(value);
  if (iso) {
    return value;
  }

  const frPattern = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/;
  const fr = frPattern.exec(value);
  if (fr) {
    const day = fr[1].padStart(2, '0');
    const month = fr[2].padStart(2, '0');
    return `${fr[3]}-${month}-${day}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString().slice(0, 10);
}

export function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== 'string') {
    return 0;
  }

  const normalized = value.replace(/\s+/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function extractLines(root: unknown, aliases: string[] = DEFAULT_LINE_ALIASES): Record<string, unknown>[] {
  const rawLines = findByAliases(root, aliases);
  if (!Array.isArray(rawLines)) {
    return [];
  }

  return rawLines.filter(
    (line): line is Record<string, unknown> => !!line && typeof line === 'object' && !Array.isArray(line),
  );
}
