package ma.nafura.platform.framework.service.csv;

import java.util.List;

/**
 * Exception carrying validation errors for a single CSV row (no rollback of other rows).
 */
public class CsvImportRowException extends RuntimeException {
    private final List<String> messages;

    public CsvImportRowException(List<String> messages) {
        super(messages != null && !messages.isEmpty() ? messages.get(0) : "Validation failed");
        this.messages = messages != null ? List.copyOf(messages) : List.of();
    }

    public List<String> getMessages() {
        return messages;
    }
}
