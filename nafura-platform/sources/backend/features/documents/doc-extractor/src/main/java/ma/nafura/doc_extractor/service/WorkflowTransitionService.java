package ma.nafura.platform.documents.docextractor.service;

import ma.nafura.platform.documents.docextractor.domain.model.workflow.DocumentWorkflowStatus;
import ma.nafura.platform.documents.docextractor.domain.model.workflow.DocumentWorkflowState;
import ma.nafura.platform.documents.docextractor.domain.model.workflow.ValidationState;
import ma.nafura.platform.documents.docextractor.domain.model.workflow.CompletenessState;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;

/**
 * Workflow Transition Service
 * 
 * Handles workflow transitions and enforces business rules.
 */
@Service
public class WorkflowTransitionService {

    /**
     * Allowed transitions map.
     * Key: from status, Value: allowed target statuses
     */
    private static final Map<DocumentWorkflowStatus, Set<DocumentWorkflowStatus>> ALLOWED_TRANSITIONS = Map.of(
        DocumentWorkflowStatus.DRAFT, Set.of(
            DocumentWorkflowStatus.DRAFT,      // Auto-save updates
            DocumentWorkflowStatus.VALIDATED,   // Validate action
            DocumentWorkflowStatus.REJECTED     // Reject action
        ),
        DocumentWorkflowStatus.VALIDATED, Set.of(
            // Validated documents can be archived in the future
            // For now, no transitions from VALIDATED
        ),
        DocumentWorkflowStatus.REJECTED, Set.of(
            // Rejected documents can be re-imported (creates new DRAFT)
            // No transitions from REJECTED
        )
    );

    /**
     * Check if a transition is allowed.
     */
    public boolean isTransitionAllowed(
        DocumentWorkflowStatus from,
        DocumentWorkflowStatus to
    ) {
        Set<DocumentWorkflowStatus> allowed = ALLOWED_TRANSITIONS.get(from);
        return allowed != null && allowed.contains(to);
    }

    /**
     * Validate and execute workflow transition.
     * 
     * @param currentState Current workflow state
     * @param targetStatus Target status
     * @param rejectionReason Required if targetStatus = REJECTED
     * @param validationState Required if targetStatus = VALIDATED
     * @return New workflow state
     * @throws IllegalArgumentException if transition is not allowed or invalid
     */
    @Transactional
    public DocumentWorkflowState transition(
        DocumentWorkflowState currentState,
        DocumentWorkflowStatus targetStatus,
        String rejectionReason,
        ValidationState validationState
    ) {
        // Validate transition is allowed
        if (!isTransitionAllowed(currentState.getStatus(), targetStatus)) {
            throw new IllegalArgumentException(
                String.format(
                    "Transition from %s to %s is not allowed",
                    currentState.getStatus(),
                    targetStatus
                )
            );
        }

        // Validate DRAFT → VALIDATED transition
        if (targetStatus == DocumentWorkflowStatus.VALIDATED) {
            if (validationState == null) {
                throw new IllegalArgumentException(
                    "Validation state is required for VALIDATED transition"
                );
            }
            if (validationState != ValidationState.VALID) {
                throw new IllegalArgumentException(
                    "Cannot validate document: validation state is INVALID"
                );
            }
        }

        // Validate DRAFT → REJECTED transition
        if (targetStatus == DocumentWorkflowStatus.REJECTED) {
            if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
                throw new IllegalArgumentException(
                    "Rejection reason is required for REJECTED transition"
                );
            }
        }

        // Build new state
        DocumentWorkflowState.DocumentWorkflowStateBuilder builder = DocumentWorkflowState.builder()
            .status(targetStatus);

        // Set rejection reason if applicable
        if (targetStatus == DocumentWorkflowStatus.REJECTED) {
            builder.rejectionReason(rejectionReason);
        }

        // Preserve secondary states only for DRAFT
        if (targetStatus == DocumentWorkflowStatus.DRAFT) {
            builder
                .validationState(currentState.getValidationState())
                .completenessState(currentState.getCompletenessState())
                .errorCount(currentState.getErrorCount());
        }

        return builder.build();
    }

    /**
     * Auto-save draft (DRAFT → DRAFT transition).
     * Updates secondary states without changing primary status.
     */
    @Transactional
    public DocumentWorkflowState autoSaveDraft(
        DocumentWorkflowState currentState,
        ValidationState validationState,
        CompletenessState completenessState,
        Integer errorCount
    ) {
        if (currentState.getStatus() != DocumentWorkflowStatus.DRAFT) {
            throw new IllegalArgumentException(
                "Auto-save only applies to DRAFT documents"
            );
        }

        return DocumentWorkflowState.builder()
            .status(DocumentWorkflowStatus.DRAFT)
            .validationState(validationState)
            .completenessState(completenessState)
            .errorCount(errorCount)
            .build();
    }
}

