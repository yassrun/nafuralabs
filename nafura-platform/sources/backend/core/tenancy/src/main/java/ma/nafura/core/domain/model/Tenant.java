package ma.nafura.platform.tenancy.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenant", indexes = {
    @Index(name = "idx_tenant_key", columnList = "key")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Platform tenant key (e.g., "socimat-sa").
     * Used to match tenants during sync.
     */
    @Column(name = "key", length = 100, unique = true)
    private String key;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "type", length = 50)
    private String type;

    @Column(name = "owner_email", length = 255)
    private String ownerEmail;

    @Column(name = "application_id", length = 50, nullable = false)
    private String applicationId;

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

