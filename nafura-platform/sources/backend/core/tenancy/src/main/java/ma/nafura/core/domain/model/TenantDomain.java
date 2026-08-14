package ma.nafura.platform.tenancy.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenant_domain", indexes = {
    @Index(name = "idx_tenant_domain_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_tenant_domain_domain_code", columnList = "domain_code"),
    @Index(name = "idx_tenant_domain_status", columnList = "status")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_tenant_domain_tenant_domain_code", columnNames = {"tenant_id", "domain_code"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantDomain {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "domain_code", nullable = false, length = 50)
    private String domainCode;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "start_at")
    private OffsetDateTime startAt;

    @Column(name = "end_at")
    private OffsetDateTime endAt;

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

