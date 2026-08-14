package ma.nafura.platform.documents.docextractor.api.response;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Full DocTypeDefinition DTO including all fields for detail views.
 */
public record DocTypeDefinitionDto(
        UUID id,
        String domainKey,
        String docTypeKey,
        int version,
        String name,
        String description,
        String status,
        String origin,      // SYSTEM or TENANT
        UUID tenantId,      // NULL for SYSTEM, populated for TENANT
        JsonNode jsonSchema,
        JsonNode uiSchema,
        JsonNode builderState,
        String promptTemplate,
        OffsetDateTime createdAt,
        String createdBy,
        OffsetDateTime updatedAt,
        String updatedBy
) {
    /**
     * Simplified constructor for backwards compatibility.
     */
    public DocTypeDefinitionDto(
            UUID id,
            String domainKey,
            String docTypeKey,
            int version,
            String name,
            JsonNode jsonSchema,
            JsonNode uiSchema
    ) {
        this(id, domainKey, docTypeKey, version, name, null, "PUBLISHED", "SYSTEM", null,
             jsonSchema, uiSchema, null, null, null, null, null, null);
    }
}

