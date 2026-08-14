package ma.nafura.platform.collaboration.docmanager.api.response;

import ma.nafura.platform.collaboration.docmanager.domain.enums.DocumentStatus;
import ma.nafura.platform.collaboration.docmanager.domain.enums.DocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
    private UUID id;
    private UUID tenantId;
    private String fileName;
    private String mimeType;
    private String storageKey;
    private String checksumSha256;
    private Long fileSizeBytes;
    private DocumentType docType;
    private DocumentStatus status;
    private OffsetDateTime occurredAt;
    private UUID uploadedByUserId;
    private Map<String, Object> meta;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}

