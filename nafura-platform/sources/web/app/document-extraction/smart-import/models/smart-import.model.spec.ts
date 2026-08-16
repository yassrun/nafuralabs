import { HttpErrorResponse } from '@angular/common/http';

import {
  DEFAULT_SMART_IMPORT_CONFIG,
  primaryArrayPath,
  readingDefaults,
  resolvedArrayPaths,
  schemaViewFromDefinition,
  type ExtractionDefinition,
} from './smart-import.model';
import { SmartImportError, mapSmartImportError } from './smart-import.errors';

describe('Smart Import platform contracts', () => {
  it('defines review policy without a write contract', () => {
    expect(DEFAULT_SMART_IMPORT_CONFIG.importPolicy).toBe('PARTIAL');
    expect('writeMode' in DEFAULT_SMART_IMPORT_CONFIG).toBeFalse();
  });

  it('builds the schema view from a screen-owned definition', () => {
    const definition: ExtractionDefinition = {
      key: 'test',
      name: 'Test',
      dataSchema: { type: 'object', properties: {} },
      presentationSchema: { sections: [] },
      arrayPath: 'rows',
    };
    const view = schemaViewFromDefinition(definition);
    expect(view.name).toBe('Test');
        expect(view.jsonSchema).toBe(definition.dataSchema);
    });

    it('treats a flat list as default complex-case settings', () => {
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

  it('preserves typed errors', () => {
    const error = new SmartImportError(
      'TOO_LARGE',
      'platform.smartImport.errors.tooLarge',
    );
    expect(mapSmartImportError(error)).toBe(error);
    expect(error.category).toBe('FILE');
  });

  it('maps network and retryable provider errors', () => {
    const network = mapSmartImportError(
      new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' }),
    );
    const rateLimited = mapSmartImportError(
      new HttpErrorResponse({ status: 429, statusText: 'Too Many Requests' }),
    );
    expect(network.code).toBe('NETWORK');
    expect(network.retryable).toBeTrue();
    expect(rateLimited.code).toBe('RATE_LIMITED');
    expect(rateLimited.retryable).toBeTrue();
  });
});

