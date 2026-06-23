package ma.nafura.platform.settings.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "setting_definition_scope", indexes = {
    @Index(name = "idx_setting_definition_scope_key", columnList = "setting_key"),
    @Index(name = "idx_setting_definition_scope_type", columnList = "scope_type")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_setting_definition_scope", columnNames = {"setting_key", "scope_type"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettingDefinitionScope {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "setting_key", nullable = false, length = 200)
    private String settingKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope_type", nullable = false, length = 20)
    private SettingScopeType scopeType;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @jakarta.persistence.PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @jakarta.persistence.PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}

