package ma.nafura.platform.collaboration.docmanager.domain.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * How a tenant wants their documents to look, as structured data rather than markup.
 *
 * <p>One row per tenant for the defaults; an optional row per entity type overrides it. The
 * header and footer fragments are regenerated from these values, so an administrator changes
 * their letterhead without ever seeing HTML.
 */
@Entity
@Table(name = "document_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    /** null = tenant-wide defaults; set = override for that document type. */
    @Column(name = "entity_type", length = 80)
    private String entityType;

    /** Serialized DocumentSettingsPayload. */
    @Column(name = "settings_json", columnDefinition = "text")
    private String settingsJson;

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
