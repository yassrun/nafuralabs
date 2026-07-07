import { InjectionToken } from '@angular/core';

export type IntegrationAuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'REJECT'
  | 'SUBMIT'
  | 'EXPORT'
  | 'PRINT'
  | 'LOGIN'
  | 'LOGOUT';

/** Optional audit hook for integration adapters (implemented by the product app). */
export interface IntegrationAuditLogger {
  log(
    action: IntegrationAuditAction,
    entityType: string,
    entityId: string,
    entityRef: string,
    detail?: string,
  ): void;
}

const noopAudit: IntegrationAuditLogger = { log: () => {} };

export const INTEGRATION_AUDIT = new InjectionToken<IntegrationAuditLogger>(
  'INTEGRATION_AUDIT',
  { factory: () => noopAudit },
);
