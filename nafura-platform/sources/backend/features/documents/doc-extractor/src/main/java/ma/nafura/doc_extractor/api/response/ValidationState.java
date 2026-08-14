package ma.nafura.platform.documents.docextractor.api.response;

/**
 * Overall validation state after schema validation of extracted JSON.
 */
public enum ValidationState {
    /** All required fields present and valid. */
    VALID,
    /** Some data extracted but required fields missing or invalid. */
    INCOMPLETE,
    /** Extraction structurally unusable (empty payload, parse failure). */
    INVALID
}
