package ma.nafura.platform.collaboration.docmanager.domain.model;

import ma.nafura.platform.collaboration.docmanager.domain.enums.DocumentStatus;
import ma.nafura.platform.collaboration.docmanager.domain.enums.DocumentType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "document")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Document {
    
    @Id
    private UUID id;
    
    @Column(name = "tenant_id")
    private UUID tenantId;
    
    @Column(name = "file_name")
    private String fileName;
    
    @Column(name = "mime_type")
    private String mimeType;
    
    @Column(name = "storage_key")
    private String storageKey;
    
    @Column(name = "checksum_sha256")
    private String checksumSha256;
    
    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "doc_type")
    @Builder.Default
    private DocumentType docType = DocumentType.OTHER;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private DocumentStatus status = DocumentStatus.UPLOADED;
    
    @Column(name = "occurred_at")
    private OffsetDateTime occurredAt;
    
    @Column(name = "uploaded_by_user_id")
    private UUID uploadedByUserId;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "meta", columnDefinition = "jsonb")
    private Map<String, Object> meta;
    
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}

