/**
 * Data passed into the Print Dialog.
 */
export interface PrintDialogData {
  /** Entity type (e.g. "invoice", "product") for template filter and API */
  entityType: string;
  /** Entity ID (UUID) for render request */
  entityId: string;
  /** Optional entity code for download filename (e.g. "INV-001") */
  entityCode?: string;
}
