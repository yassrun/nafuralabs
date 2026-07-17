import { normalizeText } from '../../utils/extraction-json.utils';

export interface ApplicationImportResult {
  created: number;
  skippedDuplicates: number;
}

export function extractionRows(
  data: Record<string, unknown>,
  arrayPath: string,
): Record<string, unknown>[] {
  const value = data[arrayPath];
  return Array.isArray(value)
    ? value.filter(
        (row): row is Record<string, unknown> =>
          !!row && typeof row === 'object' && !Array.isArray(row),
      )
    : [];
}

export async function persistUniqueRows<TPayload>(
  rows: Record<string, unknown>[],
  existingKeys: Set<string>,
  dedupeKey: (row: Record<string, unknown>) => string | null,
  mapRow: (row: Record<string, unknown>) => TPayload,
  create: (payload: TPayload) => Promise<unknown>,
): Promise<ApplicationImportResult> {
  const result: ApplicationImportResult = { created: 0, skippedDuplicates: 0 };
  const normalizedKeys = new Set([...existingKeys].map(normalizeText));

  for (const row of rows) {
    const key = dedupeKey(row);
    const normalizedKey = key ? normalizeText(key) : null;
    if (normalizedKey && normalizedKeys.has(normalizedKey)) {
      result.skippedDuplicates++;
      continue;
    }

    await create(mapRow(row));
    if (normalizedKey) normalizedKeys.add(normalizedKey);
    result.created++;
  }

  return result;
}
