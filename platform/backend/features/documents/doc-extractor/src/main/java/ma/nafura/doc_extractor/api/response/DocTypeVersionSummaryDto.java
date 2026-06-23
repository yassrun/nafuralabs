package ma.nafura.platform.documents.docextractor.api.response;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Summary DTO for listing versions of a DocType.
 */
public record DocTypeVersionSummaryDto(
        UUID id,
        int version,
        String status,
        String name,
        OffsetDateTime createdAt,
        String createdBy,
        OffsetDateTime updatedAt,
        String updatedBy
) {}

