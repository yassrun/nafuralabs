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
@Table(name = "setting_value", indexes = {
    @Index(name = "idx_setting_value_lookup", columnList = "application_id,setting_key,scope_type,scope_key"),
    @Index(name = "idx_setting_value_setting_key", columnList = "setting_key")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_setting_value_scope", columnNames = {"application_id", "setting_key", "scope_type", "scope_key"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettingValue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "application_id", nullable = false, length = 80)
    private String applicationId;

    @Column(name = "setting_key", nullable = false, length = 200)
    private String settingKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope_type", nullable = false, length = 20)
    private SettingScopeType scopeType;

    @Column(name = "scope_key", nullable = false, length = 320)
    private String scopeKey;

    @Column(name = "value", nullable = false, columnDefinition = "TEXT")
    private String value;

    @Column(name = "updated_by", length = 255)
    private String updatedBy;

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

