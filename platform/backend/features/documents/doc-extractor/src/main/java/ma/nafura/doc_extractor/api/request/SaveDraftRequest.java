package ma.nafura.platform.documents.docextractor.api.request;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for saving a draft version.
 * Server generates jsonSchema and uiSchema from builderState.
 */
public record SaveDraftRequest(
        @Size(max = 120) String name,
        String description,
        String promptTemplate,
        JsonNode builderState
) {}

