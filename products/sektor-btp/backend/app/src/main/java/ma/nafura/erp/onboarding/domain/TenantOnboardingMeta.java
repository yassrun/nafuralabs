package ma.nafura.erp.onboarding.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tenant_onboarding_meta")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantOnboardingMeta {

    @Id
    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "preset_applied_at")
    private OffsetDateTime presetAppliedAt;

    @Column(name = "preset_payload_hash", length = 64)
    private String presetPayloadHash;

    @Column(name = "preset_profile_json")
    private String presetProfileJson;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
