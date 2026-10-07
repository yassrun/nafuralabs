package ma.nafura.platform.framework.record;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * A business rule of a record refused the operation. With field errors: 422 and the same body as Bean Validation
 * ({@code fieldErrors}). Without: 409 {@code RECORD_REFUSED} and the reason, shown as is by the screen.
 */
public class RecordRuleException extends RuntimeException {

    private final Map<String, String> errors;

    private RecordRuleException(String message, Map<String, String> errors) {
        super(message);
        this.errors = errors;
    }

    /** Field → message, e.g. {@code Map.of("neededBy", "Doit suivre la date de la demande")}. */
    public static RecordRuleException fields(Map<String, String> errors) {
        return new RecordRuleException("Validation failed: " + errors.keySet(), new LinkedHashMap<>(errors));
    }

    /** The whole operation is refused, e.g. deleting a supplier that still has requests. */
    public static RecordRuleException refused(String reason) {
        return new RecordRuleException(reason, Map.of());
    }

    public Map<String, String> errors() {
        return errors;
    }
}
