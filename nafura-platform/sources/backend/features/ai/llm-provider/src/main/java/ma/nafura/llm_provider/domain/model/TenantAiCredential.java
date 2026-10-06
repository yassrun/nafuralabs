package ma.nafura.platform.ai.llm.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Per-tenant, per-provider encrypted LLM credential (BYOK). The plaintext secret is never
 * persisted: only the AES-GCM {@code ciphertext} and a display-only {@code keyHint} (last 4 chars).
 */
@Entity
@Table(name = "tenant_ai_credential", indexes = {
    @Index(name = "idx_tenant_ai_credential_tenant_provider", columnList = "tenant_id, provider", unique = true)
})
@Getter
@Setter
public class TenantAiCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 50)
    private String provider;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String ciphertext;

    @Column(name = "key_hint", length = 8)
    private String keyHint;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "updated_by")
    private String updatedBy;

    @PrePersist
    @PreUpdate
    protected void touch() {
        updatedAt = Instant.now();
    }
}
