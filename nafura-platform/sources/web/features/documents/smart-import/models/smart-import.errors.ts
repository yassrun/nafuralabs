import { HttpErrorResponse } from '@angular/common/http';

export type SmartImportErrorCategory =
  | 'FILE'
  | 'CONFIG'
  | 'EXTRACTION'
  | 'DATA'
  | 'WRITE';

export type SmartImportErrorCode =
  | 'EMPTY'
  | 'TYPE_NOT_ALLOWED'
  | 'TOO_LARGE'
  | 'READ_FAILED'
  | 'TENANT_MISSING'
  | 'HANDLER_MISSING'
  | 'DOC_TYPE_NOT_FOUND'
  | 'SCHEMA_INVALID'
  | 'TIMEOUT'
  | 'PROVIDER_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'INVALID_RESPONSE'
  | 'EXTRACTION_FAILED'
  | 'MISSING_REQUIRED'
  | 'TYPE_MISMATCH'
  | 'FORMAT_INVALID'
  | 'NO_ROWS'
  | 'DUPLICATE'
  | 'VALIDATION_REJECTED'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'NETWORK'
  | 'SERVER'
  | 'UNKNOWN';

const CATEGORY_BY_CODE: Record<SmartImportErrorCode, SmartImportErrorCategory> = {
  EMPTY: 'FILE',
  TYPE_NOT_ALLOWED: 'FILE',
  TOO_LARGE: 'FILE',
  READ_FAILED: 'FILE',
  TENANT_MISSING: 'CONFIG',
  HANDLER_MISSING: 'CONFIG',
  DOC_TYPE_NOT_FOUND: 'CONFIG',
  SCHEMA_INVALID: 'CONFIG',
  TIMEOUT: 'EXTRACTION',
  PROVIDER_UNAVAILABLE: 'EXTRACTION',
  RATE_LIMITED: 'EXTRACTION',
  INVALID_RESPONSE: 'EXTRACTION',
  EXTRACTION_FAILED: 'EXTRACTION',
  MISSING_REQUIRED: 'DATA',
  TYPE_MISMATCH: 'DATA',
  FORMAT_INVALID: 'DATA',
  NO_ROWS: 'DATA',
  DUPLICATE: 'DATA',
  VALIDATION_REJECTED: 'WRITE',
  CONFLICT: 'WRITE',
  FORBIDDEN: 'WRITE',
  NETWORK: 'WRITE',
  SERVER: 'WRITE',
  UNKNOWN: 'WRITE',
};

export class SmartImportError extends Error {
  readonly category: SmartImportErrorCategory;

  constructor(
    readonly code: SmartImportErrorCode,
    readonly messageKey: string,
    readonly retryable = false,
    readonly correlationId?: string,
    readonly technicalMessage?: string,
  ) {
    super(messageKey);
    this.name = 'SmartImportError';
    this.category = CATEGORY_BY_CODE[code];
  }
}

export function mapSmartImportError(error: unknown): SmartImportError {
  if (error instanceof SmartImportError) return error;

  if (error instanceof HttpErrorResponse) {
    const correlationId = error.error?.correlationId as string | undefined;
    if (error.status === 0) {
      return new SmartImportError('NETWORK', 'platform.smartImport.errors.network', true, correlationId);
    }
    if (error.status === 403) {
      return new SmartImportError('FORBIDDEN', 'platform.smartImport.errors.forbidden', false, correlationId);
    }
    if (error.status === 404) {
      return new SmartImportError('DOC_TYPE_NOT_FOUND', 'platform.smartImport.errors.docTypeNotFound', false, correlationId);
    }
    if (error.status === 409) {
      return new SmartImportError('CONFLICT', 'platform.smartImport.errors.conflict', false, correlationId);
    }
    if (error.status === 429) {
      return new SmartImportError('RATE_LIMITED', 'platform.smartImport.errors.rateLimited', true, correlationId);
    }
    if (error.status >= 500) {
      return new SmartImportError('SERVER', 'platform.smartImport.errors.server', true, correlationId);
    }
    return new SmartImportError(
      'VALIDATION_REJECTED',
      'platform.smartImport.errors.validationRejected',
      false,
      correlationId,
    );
  }

  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/timeout|timed out/i.test(message)) {
    return new SmartImportError('TIMEOUT', 'platform.smartImport.errors.timeout', true, undefined, message);
  }
  if (/429|rate limit/i.test(message)) {
    return new SmartImportError('RATE_LIMITED', 'platform.smartImport.errors.rateLimited', true, undefined, message);
  }
  return new SmartImportError('UNKNOWN', 'platform.smartImport.errors.unknown', false, undefined, message);
}

