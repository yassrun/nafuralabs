import { InjectionToken } from '@angular/core';

/** Payload emitted after a successful listing export (CSV / XLSX from entity listing). */
export interface ListingExportAuditPayload {
  /** Singular entity label from listing config (e.g. "Employé"). */
  entityName: string;
  /** Plural label (e.g. "Employés"). */
  entityNamePlural: string;
  format: 'csv' | 'xlsx';
  filename: string;
  rowCount: number;
  selectionOnly: boolean;
}

/**
 * Optional hook for ERP (or other shells) to record `EXPORT` audit entries when
 * `nf-entity-listing` completes an export. Platform code stays free of ERP imports.
 */
export const LISTING_EXPORT_AUDIT = new InjectionToken<(payload: ListingExportAuditPayload) => void>(
  'LISTING_EXPORT_AUDIT',
);
