package ma.nafura.platform.administration.iam.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenant_custom_role_permission", indexes = {
    @Index(name = "uk_tenant_custom_role_perm", columnList = "tenant_id, role_code, permission", unique = true),
    @Index(name = "idx_tenant_custom_role_perm_tenant_role", columnList = "tenant_id, role_code")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantCustomRolePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "role_code", nullable = false, length = 50)
    private String roleCode;

    @Column(name = "permission", nullable = false, length = 255)
    private String permission;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}

