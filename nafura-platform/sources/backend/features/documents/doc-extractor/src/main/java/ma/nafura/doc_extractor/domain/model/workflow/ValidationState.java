package ma.nafura.platform.documents.docextractor.domain.model.workflow;

/**
 * Validation State (Secondary State)
 * 
 * Describes whether the document data meets validation requirements.
 */
public enum ValidationState {
    /**
     * All required fields are valid and no blocking validation rules failed.
     */
    VALID,

    /**
     * Required fields are missing or blocking validation rules failed.
     */
    INVALID
}

