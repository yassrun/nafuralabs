package ma.nafura.platform.documents.docextractor.service.builder;

import java.util.ArrayList;
import java.util.List;

/**
 * Result of validating a BuilderState.
 */
public record ValidationResult(
        boolean isValid,
        List<String> errors
) {
    public static ValidationResult valid() {
        return new ValidationResult(true, List.of());
    }

    public static ValidationResult invalid(String error) {
        return new ValidationResult(false, List.of(error));
    }

    public static ValidationResult invalid(List<String> errors) {
        return new ValidationResult(false, errors);
    }

    /**
     * Merge multiple validation results.
     */
    public static ValidationResult merge(ValidationResult... results) {
        List<String> allErrors = new ArrayList<>();
        for (ValidationResult result : results) {
            if (!result.isValid()) {
                allErrors.addAll(result.errors());
            }
        }
        return allErrors.isEmpty() ? valid() : invalid(allErrors);
    }
}

