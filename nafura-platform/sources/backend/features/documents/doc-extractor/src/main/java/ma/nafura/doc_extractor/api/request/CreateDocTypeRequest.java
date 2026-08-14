package ma.nafura.platform.documents.docextractor.api.request;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for creating a new DocType (v1 draft).
 */
public record CreateDocTypeRequest(
        @NotBlank @Size(max = 80) String domainKey,
        @NotBlank @Size(max = 80) String docTypeKey,
        @NotBlank @Size(max = 120) String name,
        String description,
        String promptTemplate,
        JsonNode builderState
) {}

