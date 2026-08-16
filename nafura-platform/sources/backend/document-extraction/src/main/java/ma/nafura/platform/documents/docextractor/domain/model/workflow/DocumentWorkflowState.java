package ma.nafura.platform.documents.docextractor.domain.model.workflow;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * Document Workflow State
 * 
 * Combines primary status with secondary states (validation and completeness).
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DocumentWorkflowState {
    /**
     * Primary workflow status
     */
    private DocumentWorkflowStatus status;

    /**
     * Validation state (only relevant for DRAFT)
     * null for non-DRAFT statuses
     */
    private ValidationState validationState;

    /**
     * Completeness state (only relevant for DRAFT)
     * null for non-DRAFT statuses
     */
    private CompletenessState completenessState;

    /**
     * Number of validation errors (only when validationState = INVALID)
     * null when no errors
     */
    private Integer errorCount;

    /**
     * Rejection reason (only when status = REJECTED)
     * null for non-REJECTED statuses
     */
    private String rejectionReason;
}

