/**
 * Data passed into the Send Email Dialog.
 */
export interface SendEmailDialogData {
  /** Entity type (e.g. "invoice") for email and print templates */
  entityType: string;
  /** Entity ID (UUID) */
  entityId: string;
  /** Optional entity code for display (e.g. "INV-001") */
  entityCode?: string;
  /** Pre-fill To field from entity (e.g. customer email) */
  initialTo?: string;
}
