package ma.nafura.platform.authorization.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Role Permission entity.
 * Maps roles to their permissions.
 */
@Entity
@Table(name = "role_permission", indexes = {
    @Index(name = "idx_role_permission_role_code", columnList = "role_code"),
    @Index(name = "idx_role_permission_permission", columnList = "permission")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_role_permission_role_permission", columnNames = {"role_code", "permission"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RolePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "role_code", nullable = false, length = 50)
    private String roleCode;

    @Column(name = "permission", nullable = false, length = 255)
    private String permission;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}

