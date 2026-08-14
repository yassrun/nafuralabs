package ma.nafura.platform.authorization.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Tenant-scoped user roles.
 */
@Entity
@Table(name = "tenant_user_role", indexes = {
    @Index(name = "idx_tenant_user_role_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_tenant_user_role_user_id", columnList = "user_id"),
    @Index(name = "idx_tenant_user_role_role_code", columnList = "role_code")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_tenant_user_role_tenant_user_role", columnNames = {"tenant_id", "user_id", "role_code"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantUserRole {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "role_code", nullable = false, length = 50)
    private String roleCode;

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

