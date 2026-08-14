package ma.nafura.platform.documents.docextractor.domain.model.workflow;

/**
 * Document Workflow Status
 * 
 * Primary workflow statuses for documents in the system.
 * These represent the main state of a document.
 */
public enum DocumentWorkflowStatus {
    /**
     * Document exists, data is editable, auto-saved continuously.
     * Document is not yet exploitable by downstream systems.
     */
    DRAFT,

    /**
     * Document is currently being processed (extraction, OCR, etc.).
     */
    IN_PROGRESS,

    /**
     * Data has been explicitly validated by a human (or auto-validation).
     * Document becomes exploitable by downstream systems.
     */
    VALIDATED,

    /**
     * Document is invalid, unreadable, or wrong type.
     * Requires a rejection reason.
     */
    REJECTED
}

