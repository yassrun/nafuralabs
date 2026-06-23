/**
 * Document Workflow Models
 * 
 * Defines the workflow statuses, secondary states, and transition rules
 * for the document management system with OCR and data extraction.
 */

/**
 * Primary workflow statuses.
 * These represent the main state of a document in the system.
 */
export enum DocumentWorkflowStatus {
  /**
   * Document is being processed (e.g. extraction running).
   * Usually transitions to DRAFT (editable) or REJECTED on failure.
   */
  IN_PROGRESS = 'IN_PROGRESS',

  /**
   * Document exists, data is editable, auto-saved continuously.
   * Document is not yet exploitable by downstream systems.
   */
  DRAFT = 'DRAFT',

  /**
   * Data has been explicitly validated by a human (or auto-validation).
   * Document becomes exploitable by downstream systems.
   */
  VALIDATED = 'VALIDATED',

  /**
   * Document is invalid, unreadable, or wrong type.
   * Requires a rejection reason.
   */
  REJECTED = 'REJECTED',
}

/**
 * Validation state (secondary state).
 * Describes whether the document data meets validation requirements.
 */
export enum ValidationState {
  /**
   * All required fields are valid and no blocking validation rules failed.
   */
  VALID = 'VALID',

  /**
   * Required fields are missing or blocking validation rules failed.
   */
  INVALID = 'INVALID',
}

/**
 * Completeness state (secondary state).
 * Describes whether all fields (required and optional) are filled.
 */
export enum CompletenessState {
  /**
   * All required fields are valid, but some optional fields may be missing.
   */
  PARTIAL = 'PARTIAL',

  /**
   * All required and optional fields are filled.
   */
  COMPLETE = 'COMPLETE',
}

/**
 * Document workflow state.
 * Combines primary status with secondary states.
 */
export interface DocumentWorkflowState {
  /** Primary workflow status */
  status: DocumentWorkflowStatus;

  /** Validation state (only relevant for DRAFT) */
  validationState?: ValidationState;

  /** Completeness state (only relevant for DRAFT) */
  completenessState?: CompletenessState;

  /** Number of validation errors (only when validationState = INVALID) */
  errorCount?: number;

  /** Rejection reason (only when status = REJECTED) */
  rejectionReason?: string;
}

/**
 * Allowed workflow transitions.
 */
export const WORKFLOW_TRANSITIONS: Record<DocumentWorkflowStatus, DocumentWorkflowStatus[]> = {
  [DocumentWorkflowStatus.IN_PROGRESS]: [
    DocumentWorkflowStatus.DRAFT,
    DocumentWorkflowStatus.REJECTED,
  ],
  [DocumentWorkflowStatus.DRAFT]: [
    DocumentWorkflowStatus.DRAFT,      // Auto-save updates
    DocumentWorkflowStatus.VALIDATED,  // Validate action
    DocumentWorkflowStatus.REJECTED,   // Reject action
  ],
  [DocumentWorkflowStatus.VALIDATED]: [
    // Validated documents can be archived in the future
    // For now, no transitions from VALIDATED
  ],
  [DocumentWorkflowStatus.REJECTED]: [
    // Rejected documents can be re-imported (creates new DRAFT)
    // No transitions from REJECTED
  ],
};

/**
 * Check if a transition is allowed.
 */
export function isTransitionAllowed(
  from: DocumentWorkflowStatus,
  to: DocumentWorkflowStatus
): boolean {
  return WORKFLOW_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get display label for workflow status.
 */
export function getWorkflowStatusLabel(status: DocumentWorkflowStatus): string {
  const labels: Record<DocumentWorkflowStatus, string> = {
    [DocumentWorkflowStatus.IN_PROGRESS]: 'Processing',
    [DocumentWorkflowStatus.DRAFT]: 'Draft',
    [DocumentWorkflowStatus.VALIDATED]: 'Validated',
    [DocumentWorkflowStatus.REJECTED]: 'Rejected',
  };
  return labels[status];
}

/**
 * Get display label for validation state.
 */
export function getValidationStateLabel(state: ValidationState): string {
  return state === ValidationState.VALID ? 'Valid' : 'Invalid';
}

/**
 * Get display label for completeness state.
 */
export function getCompletenessStateLabel(state: CompletenessState): string {
  return state === CompletenessState.COMPLETE ? 'Complete' : 'Partial';
}

/**
 * Format secondary state badge text for DRAFT documents.
 */
export function formatDraftBadge(state: DocumentWorkflowState): string {
  if (state.status !== DocumentWorkflowStatus.DRAFT) {
    return '';
  }

  if (state.validationState === ValidationState.INVALID && state.errorCount) {
    return `Draft · Errors (${state.errorCount})`;
  }

  if (state.completenessState === CompletenessState.PARTIAL) {
    return 'Draft · Partial';
  }

  if (state.completenessState === CompletenessState.COMPLETE) {
    return 'Draft · Complete';
  }

  return 'Draft';
}
