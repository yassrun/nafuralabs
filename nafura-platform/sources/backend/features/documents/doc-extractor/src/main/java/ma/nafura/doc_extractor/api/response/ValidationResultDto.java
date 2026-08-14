package ma.nafura.platform.documents.docextractor.api.response;

import java.util.List;

/**
 * DTO for validation results from builder state validation.
 */
public record ValidationResultDto(
        boolean isValid,
        List<String> errors
) {
    public static ValidationResultDto valid() {
        return new ValidationResultDto(true, List.of());
    }

    public static ValidationResultDto invalid(List<String> errors) {
        return new ValidationResultDto(false, errors);
    }

    public static ValidationResultDto invalid(String error) {
        return new ValidationResultDto(false, List.of(error));
    }
}

