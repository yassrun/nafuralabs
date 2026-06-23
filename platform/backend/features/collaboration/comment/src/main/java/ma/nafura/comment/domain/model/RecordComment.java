package ma.nafura.platform.collaboration.comment.domain.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "record_comments", indexes = {
    @Index(name = "idx_record_comments_tenant_entity", columnList = "tenant_id, entity_type, entity_id"),
    @Index(name = "idx_record_comments_parent", columnList = "parent_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordComment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "entity_type", nullable = false, length = 80)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "author", nullable = false, length = 120)
    private String author;

    @Column(name = "body", nullable = false)
    private String body;

    @Column(name = "is_internal")
    private Boolean isInternal;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "edited_at")
    private OffsetDateTime editedAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}

