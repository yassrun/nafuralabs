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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "setting_definition", indexes = {
    @Index(name = "idx_setting_definition_owner", columnList = "owner_level,application_id,domain_code,feature_code"),
    @Index(name = "idx_setting_definition_active", columnList = "is_active")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettingDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "setting_key", nullable = false, unique = true, length = 200)
    private String settingKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "owner_level", nullable = false, length = 20)
    private SettingOwnerLevel ownerLevel;

    @Column(name = "application_id", length = 80)
    private String applicationId;

    @Column(name = "domain_code", length = 80)
    private String domainCode;

    @Column(name = "feature_code", length = 80)
    private String featureCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "value_type", nullable = false, length = 20)
    private SettingValueType valueType;

    @Column(name = "default_value", columnDefinition = "TEXT")
    private String defaultValue;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "is_secret", nullable = false)
    @Builder.Default
    private boolean secret = false;

    @Column(name = "is_mutable", nullable = false)
    @Builder.Default
    private boolean mutable = true;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

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

