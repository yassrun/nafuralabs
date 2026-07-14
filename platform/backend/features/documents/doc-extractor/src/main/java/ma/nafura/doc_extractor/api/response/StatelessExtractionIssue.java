package ma.nafura.platform.documents.docextractor.api.response;

/**
 * Stable, transport-friendly issue returned by the stateless extraction API.
 */
public record StatelessExtractionIssue(
        String source,
        String code,
        String path,
        Integer rowIndex,
        String message,
        boolean retryable
) {
}
