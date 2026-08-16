import {
  primaryArrayPath,
  readingDefaults,
  resolvedArrayPaths,
  type ExtractionDefinition,
} from '@platform/app/document-extraction/smart-import';

describe('ExtractionDefinition reading defaults', () => {
  it('treats a flat list as the default complex-case settings', () => {
    const definition: ExtractionDefinition = {
      key: 'clients',
      name: 'Clients',
      dataSchema: { type: 'object', properties: {} },
      presentationSchema: { sections: [] },
      arrayPath: 'clients',
    };
    const defaults = readingDefaults(definition);
    expect(defaults.arrayPaths).toEqual(['clients']);
    expect(defaults.anchors).toEqual([]);
    expect(defaults.rowClasses).toEqual([{ name: 'record', signal: 'default' }]);
    expect(defaults.hierarchy).toBe('NONE');
    expect(defaults.depivot).toBe('RESERVED');
    expect(primaryArrayPath(definition)).toBe('clients');
  });

  it('keeps arrayPath when arrayPaths is set — no migration', () => {
    const definition: ExtractionDefinition = {
      key: 'cps',
      name: 'CPS',
      dataSchema: { type: 'object', properties: {} },
      presentationSchema: { sections: [] },
      arrayPath: 'clauses',
      arrayPaths: ['clauses', 'annexes'],
    };
    expect(primaryArrayPath(definition)).toBe('clauses');
    expect(resolvedArrayPaths(definition)).toEqual(['clauses', 'annexes']);
  });
});
