package ma.nafura.platform.documents.docextractor.api.response;

import java.util.List;

/**
 * Schema validation result returned alongside extracted JSON.
 */
public record ExtractionValidationDto(
        ValidationState state,
        List<FieldIssueDto> issues,
        String importPolicy
) {
    public static ExtractionValidationDto valid(String importPolicy) {
        return new ExtractionValidationDto(ValidationState.VALID, List.of(), importPolicy);
    }
}
