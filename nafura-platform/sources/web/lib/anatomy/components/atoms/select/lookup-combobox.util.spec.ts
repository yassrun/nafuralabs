import {
  LOOKUP_ORPHAN_LABEL,
  comboHitsComeFromServer,
  filterLookupHits,
  lookupDisplayLabel,
  comboTypingLocked,
  lookupOptionsEqual,
  resolveLookupEyeRoute,
} from './lookup-combobox.util';

const OPTS = [
  { value: 'id-a', label: 'FRN-0142 — Beton Atlas' },
  { value: 'id-b', label: 'FRN-0201 — Atlas Acier' },
  { value: 'frn-exact', label: 'Autre' },
];

describe('filterLookupHits', () => {
  it('AC-2 returns no hits before 2 characters', () => {
    expect(filterLookupHits(OPTS, '')).toEqual([]);
    expect(filterLookupHits(OPTS, 'a')).toEqual([]);
  });

  it('filters on label and puts exact value first', () => {
    const hits = filterLookupHits(
      [...OPTS, { value: 'at', label: 'AT code' }],
      'at'
    );
    expect(hits[0].value).toBe('at');
    expect(hits.some((h) => h.label.includes('Atlas'))).toBe(true);
  });

  it('does not throw when a hit has no label', () => {
    const hits = filterLookupHits(
      [{ value: 'xx-id', label: undefined as unknown as string }],
      'ad'
    );
    expect(hits).toEqual([]);
  });
});

describe('resolveLookupEyeRoute', () => {
  it('AC-7 empty value opens the listing', () => {
    expect(resolveLookupEyeRoute('/achats/fournisseurs', '')).toBe(
      '/achats/fournisseurs'
    );
  });

  it('AC-6 set value opens the fiche', () => {
    expect(resolveLookupEyeRoute('/achats/fournisseurs/', 'abc')).toBe(
      '/achats/fournisseurs/abc'
    );
  });

  it('AC-8 no route when list is missing', () => {
    expect(resolveLookupEyeRoute(undefined, 'abc')).toBeUndefined();
  });
});

describe('comboHitsComeFromServer', () => {
  it('skips options-driven refresh when a server searcher is bound', () => {
    const search = (_q: string) => Promise.resolve([]);
    expect(comboHitsComeFromServer(search)).toBe(true);
    expect(comboHitsComeFromServer(undefined)).toBe(false);
  });
});

describe('comboTypingLocked', () => {
  it('locks typing when a value is set and unlocks when empty', () => {
    expect(comboTypingLocked('id-a')).toBe(true);
    expect(comboTypingLocked('  ')).toBe(false);
    expect(comboTypingLocked('')).toBe(false);
    expect(comboTypingLocked(null)).toBe(false);
  });
});

describe('lookupOptionsEqual', () => {
  it('treats equal content as stable even when the array identity differs', () => {
    expect(lookupOptionsEqual(OPTS, [...OPTS])).toBe(true);
    expect(lookupOptionsEqual(OPTS, OPTS.slice(0, 1))).toBe(false);
  });
});

describe('lookupDisplayLabel', () => {
  it('AC-14 hides a raw UUID when the row is missing', () => {
    const uuid = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
    expect(lookupDisplayLabel(uuid, OPTS)).toBe(LOOKUP_ORPHAN_LABEL);
  });

  it('uses the option label when present', () => {
    expect(lookupDisplayLabel('id-a', OPTS)).toBe('FRN-0142 — Beton Atlas');
  });
});
