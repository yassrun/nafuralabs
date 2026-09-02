import { fieldPresence, shouldBlockImportOnMissing } from './field-presence.util';

describe('field-presence.util', () => {
  it('defaults required json fields to extract', () => {
    expect(fieldPresence({ type: 'string', title: 'Code' }, 'code', new Set(['code']))).toBe('extract');
    expect(shouldBlockImportOnMissing({ type: 'string' }, 'code', new Set(['code']))).toBe(true);
  });

  it('honours explicit infer presence', () => {
    const schema = { type: 'string', xNafura: { presence: 'infer' as const } };
    expect(fieldPresence(schema, 'familleName', new Set())).toBe('infer');
    expect(shouldBlockImportOnMissing(schema, 'familleName', new Set())).toBe(false);
  });

  it('defaults non-required fields to optional', () => {
    expect(fieldPresence({ type: 'number' }, 'prixUnitaire', new Set())).toBe('optional');
  });
});
