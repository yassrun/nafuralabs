package ma.nafura.platform.scope.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "app_scope",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_app_scope_application_key", columnNames = {"application_id", "scope_key"})
    },
    indexes = {
        @Index(name = "idx_app_scope_application_id", columnList = "application_id"),
        @Index(name = "idx_app_scope_scope_key", columnList = "scope_key")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppScope {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "scope_key", nullable = false, length = 100)
    private String scopeKey;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "type", nullable = false, length = 50)
    @Builder.Default
    private String type = "APP_DEFAULT";

    @Column(name = "application_id", nullable = false, length = 100)
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

