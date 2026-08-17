package ma.nafura.etudes.domain.dossier;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "guest_access_links")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuestAccessLink {

    public static final String PURPOSE_CLIENT_VIEW = "CLIENT_VIEW";
    public static final String PURPOSE_FOURNISSEUR_UPLOAD = "FOURNISSEUR_UPLOAD";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "dossier_etude_id", nullable = false)
    private UUID dossierEtudeId;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "purpose", nullable = false, length = 40)
    private String purpose;

    @Column(name = "token_hash", nullable = false, length = 64, unique = true)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "revoked_at")
    private OffsetDateTime revokedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "last_seen_at")
    private OffsetDateTime lastSeenAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    public boolean isActive(OffsetDateTime now) {
        if (revokedAt != null) {
            return false;
        }
        return expiresAt != null && now.isBefore(expiresAt);
    }
}
