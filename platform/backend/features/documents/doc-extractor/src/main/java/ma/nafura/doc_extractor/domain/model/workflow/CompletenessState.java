package ma.nafura.platform.documents.docextractor.domain.model.workflow;

/**
 * Completeness State (Secondary State)
 * 
 * Describes whether all fields (required and optional) are filled.
 */
public enum CompletenessState {
    /**
     * All required fields are valid, but some optional fields may be missing.
     */
    PARTIAL,

    /**
     * All required and optional fields are filled.
     */
    COMPLETE
}

