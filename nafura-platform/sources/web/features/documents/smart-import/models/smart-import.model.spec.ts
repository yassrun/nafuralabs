import { HttpErrorResponse } from '@angular/common/http';

import {
  DEFAULT_SMART_IMPORT_CONFIG,
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

