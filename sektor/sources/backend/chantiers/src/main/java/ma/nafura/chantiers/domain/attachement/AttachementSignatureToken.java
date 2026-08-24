package ma.nafura.chantiers.domain.attachement;

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

/**
 * AC-19 du contrat {@code avancement-et-attachement} — le jeton du lien public de signature,
 * distinct de l'identifiant de l'attachement.
 *
 * <p>Le jeton **brut** n'est jamais stocké : seul son hash SHA-256 ({@link #tokenHash}) l'est,
 * exactement comme {@code GuestAccessLink} (étude). Non devinable (32 octets aléatoires,
 * {@link java.security.SecureRandom}), non énumérable (recherche par hash, jamais par id
 * séquentiel), daté ({@link #expiresAt}) et à usage unique ({@link #consumedAt}).
 *
 * <p>Pas de {@code tenant_id} scopé JPA : au moment où ce jeton est résolu, aucun tenant n'est
 * encore connu (endpoint public, sans authentification) — c'est justement le jeton qui le donne.
 */
@Entity
@Table(name = "attachement_signature_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttachementSignatureToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "attachement_id", nullable = false, length = 100)
    private String attachementId;

    @Column(name = "token_hash", nullable = false, length = 64, unique = true)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    /** {@code null} tant que la signature n'a pas été déposée — à usage unique une fois posé. */
    @Column(name = "consumed_at")
    private OffsetDateTime consumedAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    /** Ni expiré, ni déjà consommé. */
    public boolean isUsable(OffsetDateTime now) {
        return consumedAt == null && expiresAt != null && now.isBefore(expiresAt);
    }
}
