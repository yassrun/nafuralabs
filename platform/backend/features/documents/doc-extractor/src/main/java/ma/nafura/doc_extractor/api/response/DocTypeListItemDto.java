package ma.nafura.platform.documents.docextractor.api.response;

import java.util.UUID;

/**
 * List item DTO for doc types with origin information.
 */
public record DocTypeListItemDto(
        String domainKey,
        String docTypeKey,
        String name,
        int activeVersion,
        String origin,    // SYSTEM or TENANT
        UUID tenantId     // NULL for SYSTEM, populated for TENANT
) {
    /**
     * Backwards-compatible constructor without origin fields.
     */
    public DocTypeListItemDto(String domainKey, String docTypeKey, String name, int activeVersion) {
        this(domainKey, docTypeKey, name, activeVersion, "SYSTEM", null);
    }
}

