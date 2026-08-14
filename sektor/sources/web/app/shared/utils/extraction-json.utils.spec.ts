import {
  extractLines,
  extractObject,
  findByAliases,
  findStringByAliases,
  normalizeDate,
  normalizeText,
  toNumber,
} from './extraction-json.utils';

describe('extraction-json.utils', () => {
  it('extractObject parses JSON strings and ignores invalid payloads', () => {
    expect(extractObject('{"a":1}')).toEqual({ a: 1 });
    expect(extractObject('{invalid json')).toEqual({});
    expect(extractObject(['x'])).toEqual({});
  });

  it('findByAliases walks nested objects and arrays', () => {
    const data = {
      root: {
        payload: [
          { note: 'none' },
          { supplierName: 'ACME' },
        ],
      },
    };

    expect(findByAliases(data, ['supplier', 'supplierName'])).toBe('ACME');
  });

  it('findStringByAliases returns trimmed strings only', () => {
    const data = { fournisseur: '  Atlas SARL  ', count: 2 };
    expect(findStringByAliases(data, ['fournisseur'])).toBe('Atlas SARL');
    expect(findStringByAliases(data, ['count'])).toBeUndefined();
  });

  it('normalizeDate supports ISO and dd/mm/yyyy', () => {
    expect(normalizeDate('2026-06-18')).toBe('2026-06-18');
    expect(normalizeDate('18/6/2026')).toBe('2026-06-18');
    expect(normalizeDate('invalid-date')).toBeUndefined();
  });

  it('extractLines returns structured line objects', () => {
    const data = {
      details: [
        { code: 'A1', qty: 2 },
        null,
        'oops',
      ],
    };

    const lines = extractLines(data, ['details']);
    expect(lines.length).toBe(1);
    expect(lines[0]).toEqual({ code: 'A1', qty: 2 });
  });

  it('toNumber and normalizeText normalize input consistently', () => {
    expect(toNumber('1 234,50')).toBe(1234.5);
    expect(toNumber('abc')).toBe(0);
    expect(normalizeText(' Électricité ')).toBe('electricite');
  });
});
