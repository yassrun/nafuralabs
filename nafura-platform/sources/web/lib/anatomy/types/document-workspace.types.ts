/**
 * Document workspace — aligns with naf/erp/schemas/document.config.schema.json
 * (TypeScript surface for shells and config-driven pages; no runtime JSON loading here).
 */

export type DocumentActionKind =
  | 'submit'
  | 'approve'
  | 'reject'
  | 'post'
  | 'cancel'
  | 'print'
  | 'export'
  | 'duplicate'
  | 'void'
  | 'command'
  | 'navigate'
  | 'custom';

export type DocumentStatusSeverity = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

/** Single workflow/status chip mapping (resolved labels at UI layer). */
export interface DocumentWorkflowStateUi {
  value: string;
  label: string;
  severity: DocumentStatusSeverity;
}

/** Status ribbon / badge region. */
export interface DocumentStatusRibbonConfig {
  statusFieldPath: string;
  /** Optional heading (plain string; i18n resolved by caller if needed). */
  label?: string;
  states?: DocumentWorkflowStateUi[];
}

/** One totals row (label + value from model path). */
export interface DocumentTotalsItemConfig {
  id: string;
  label: string;
  fieldPath: string;
  format?: string;
}

export interface DocumentTotalsBlockConfig {
  title?: string;
  items: DocumentTotalsItemConfig[];
}

/** Primary document toolbar action (UI-ready). */
export interface DocumentActionUiConfig {
  id: string;
  kind: DocumentActionKind;
  label: string;
  icon?: string;
  permission?: string;
  commandId?: string;
}

export interface DocumentWorkspaceFeatureFlags {
  print?: boolean;
  export?: boolean;
  attachments?: boolean;
  /** Audit / history placeholder + optional projected content. */
  workflow?: boolean;
}

export interface DocumentAttachmentZoneConfig {
  title?: string;
  maxCount?: number;
  acceptMime?: string[];
}

export interface DocumentAuditZoneConfig {
  title?: string;
  /** Opaque binding id for future audit feed wiring. */
  binding?: string;
}

export interface DocumentActionEvent {
  actionId: string;
  kind: DocumentActionKind;
  document: unknown | null;
  commandId?: string;
}
