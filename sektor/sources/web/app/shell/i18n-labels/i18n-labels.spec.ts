/**
 * Phase 1.2 — Spec for the centralised `*_KEYS` maps.
 *
 * Validates that:
 *  1. Every value in every map exported by `index.ts` is a string of the form
 *     `enum.<entity>.<field>.<value>` (snake-case segments).
 *  2. Every value is present in BOTH `core/fr.json` AND `core/en.json`.
 *  3. EN ≠ FR translation for every key (modulo a whitelist of acronyms /
 *     pure-numeric / single-token values).
 *  4. The barrel registry is non-empty (defensive check — guards against a
 *     dropped `export *` in `index.ts`).
 */

import { I18N_LABEL_REGISTRY, resolveEnumKey } from './index';

const KEY_FORMAT_REGEX = /^enum\.[a-z][a-z0-9]*(?:_[a-z0-9]+)*\.[a-z][a-z0-9]*(?:_[a-z0-9]+)*\.[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

/**
 * Mirrored from `web/eslint-rules/no-hardcoded-string.js` (DEFAULT_WHITELIST_ACRONYMS).
 * Kept in sync manually — if you add acronyms here, update the eslint rule too.
 */
const WHITELIST_ACRONYMS = new Set<string>([
  'ICE', 'RIB', 'IF', 'RC', 'CNSS', 'AMO', 'CIMR', 'CIN',
  'MAD', 'EUR', 'USD', 'DH', 'DHS',
  'BTP', 'MOA', 'MOE', 'DGD', 'OS', 'BC', 'BL', 'BR',
  'IS', 'IR', 'TVA', 'VAT', 'CGNC', 'CGI', 'DGI', 'RAS', 'RG',
  'CRM', 'ERP', 'KPI', 'API', 'URL', 'HTTP', 'HTTPS', 'JSON', 'CSV',
  'EP', 'OK', 'KO', 'PME', 'PMI', 'SARL', 'SA', 'SAS', 'SNC', 'GIE',
  'EPI', 'PPSPS', 'DUER', 'HSE',
]);

function lookup(obj: unknown, dotted: string): unknown {
  const parts = dotted.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function isWhitelistedSameValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/^[0-9.,\s%/€$£-]+$/.test(trimmed)) return true; // pure-numeric / symbol
  if (WHITELIST_ACRONYMS.has(trimmed.toUpperCase())) return true;
  if (trimmed.length <= 2) return true; // 1-2 chars (codes, glyphs)
  return false;
}

describe('i18n-labels — centralised *_KEYS (Phase 1.2)', () => {
  let frPack: Record<string, unknown> | null = null;
  let enPack: Record<string, unknown> | null = null;
  let loadError: unknown = null;

  beforeAll(async () => {
    try {
      const [frRes, enRes] = await Promise.all([
        fetch('/assets/i18n/core/fr.json'),
        fetch('/assets/i18n/core/en.json'),
      ]);
      if (!frRes.ok || !enRes.ok) {
        throw new Error(`fr=${frRes.status} en=${enRes.status}`);
      }
      frPack = await frRes.json();
      enPack = await enRes.json();
    } catch (err) {
      loadError = err;
    }
  });

  it('registry exports at least 30 maps (sanity guard against dropped exports)', () => {
    expect(Object.keys(I18N_LABEL_REGISTRY).length).toBeGreaterThanOrEqual(30);
  });

  it('every value in every map is a snake-case `enum.<entity>.<field>.<value>` key', () => {
    const offenders: string[] = [];
    for (const [mapName, map] of Object.entries(I18N_LABEL_REGISTRY)) {
      for (const [enumValue, key] of Object.entries(map)) {
        if (typeof key !== 'string' || !KEY_FORMAT_REGEX.test(key)) {
          offenders.push(`${mapName}.${enumValue}=${JSON.stringify(key)}`);
        }
      }
    }
    expect(offenders).withContext(`Keys not matching enum.*.*.*: ${offenders.join(', ')}`).toEqual([]);
  });

  it('every *_KEYS value is present in both core/fr.json and core/en.json', () => {
    if (loadError) {
      fail(`could not load core/{fr,en}.json: ${String(loadError)}`);
      return;
    }
    expect(frPack).withContext('frPack loaded').not.toBeNull();
    expect(enPack).withContext('enPack loaded').not.toBeNull();

    const missingFr: string[] = [];
    const missingEn: string[] = [];

    for (const [mapName, map] of Object.entries(I18N_LABEL_REGISTRY)) {
      for (const key of Object.values(map)) {
        const fr = lookup(frPack, key);
        const en = lookup(enPack, key);
        if (typeof fr !== 'string' || !fr) missingFr.push(`${mapName}→${key}`);
        if (typeof en !== 'string' || !en) missingEn.push(`${mapName}→${key}`);
      }
    }

    expect(missingFr)
      .withContext(`Keys missing in core/fr.json: ${missingFr.slice(0, 10).join(', ')} (${missingFr.length} total)`)
      .toEqual([]);
    expect(missingEn)
      .withContext(`Keys missing in core/en.json: ${missingEn.slice(0, 10).join(', ')} (${missingEn.length} total)`)
      .toEqual([]);
  });

  it('EN translation is never identical to FR (except whitelisted acronyms)', () => {
    if (loadError) {
      fail(`could not load core/{fr,en}.json: ${String(loadError)}`);
      return;
    }

    const duplicates: string[] = [];
    for (const [mapName, map] of Object.entries(I18N_LABEL_REGISTRY)) {
      for (const key of Object.values(map)) {
        const fr = lookup(frPack, key);
        const en = lookup(enPack, key);
        if (typeof fr !== 'string' || typeof en !== 'string') continue;
        if (fr === en && !isWhitelistedSameValue(fr)) {
          duplicates.push(`${mapName}→${key}: "${fr}"`);
        }
      }
    }

    expect(duplicates)
      .withContext(`EN == FR (non-whitelisted) for: ${duplicates.slice(0, 10).join(', ')} (${duplicates.length} total)`)
      .toEqual([]);
  });

  describe('resolveEnumKey() helper', () => {
    it('returns the mapped key when the value is known', () => {
      const sample = Object.entries(I18N_LABEL_REGISTRY)[0];
      const [, firstMap] = sample;
      const [firstEnumValue, firstKey] = Object.entries(firstMap)[0];
      expect(resolveEnumKey(firstMap, firstEnumValue)).toBe(firstKey);
    });

    it('falls back to the raw value when the key is unknown', () => {
      const sample = Object.entries(I18N_LABEL_REGISTRY)[0];
      const [, firstMap] = sample;
      expect(resolveEnumKey(firstMap, '__not_a_real_value__')).toBe('__not_a_real_value__');
    });

    it('returns an empty string for null/undefined inputs (graceful degradation)', () => {
      const sample = Object.entries(I18N_LABEL_REGISTRY)[0];
      const [, firstMap] = sample;
      expect(resolveEnumKey(firstMap, null)).toBe('');
      expect(resolveEnumKey(firstMap, undefined)).toBe('');
    });
  });
});
