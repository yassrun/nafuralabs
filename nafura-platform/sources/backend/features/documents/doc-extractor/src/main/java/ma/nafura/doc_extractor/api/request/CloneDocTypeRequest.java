package ma.nafura.platform.documents.docextractor.api.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request DTO for cloning an existing DocType version to a new draft.
 */
public record CloneDocTypeRequest(
        @NotNull UUID fromVersionId
) {}

