package ma.nafura.platform.authorization.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Global user roles (independent of tenant membership).
 */
@Entity
@Table(name = "user_role", indexes = {
    @Index(name = "idx_user_role_user_id", columnList = "user_id"),
    @Index(name = "idx_user_role_role_code", columnList = "role_code")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_user_role_user_role", columnNames = {"user_id", "role_code"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRole {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

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

