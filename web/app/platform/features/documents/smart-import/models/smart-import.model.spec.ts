import { HttpErrorResponse } from '@angular/common/http';

import {
  DEFAULT_SMART_IMPORT_CONFIG,
  emptySmartImportResult,
} from './smart-import.model';
import { SmartImportError, mapSmartImportError } from './smart-import.errors';

describe('Smart Import platform contracts', () => {
  it('reviews rows before writing by default', () => {
    expect(DEFAULT_SMART_IMPORT_CONFIG.writeMode).toBe('REVIEW_BEFORE_WRITE');
    expect(DEFAULT_SMART_IMPORT_CONFIG.importPolicy).toBe('PARTIAL');
  });

  it('creates a detailed empty result', () => {
    const result = emptySmartImportResult([]);
    expect(result.imported).toBe(0);
    expect(result.skippedByUser).toBe(0);
    expect(result.rows).toEqual([]);
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

