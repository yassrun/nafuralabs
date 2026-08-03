package ma.nafura.etudes.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
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
import ma.nafura.etudes.domain.audit.AuditableEtude;
import ma.nafura.etudes.domain.audit.EtudeAuditingListener;

/**
 * Slot de pièce attendue sur un dossier (checklist CPS / manuel).
 *
 * <p>BDP et CPS sont seedés à la création. Les propositions IA s'ajoutent sans écraser un
 * document déjà joint.
 */
@Entity
@Table(name = "dossier_piece_attendue")
@EntityListeners(EtudeAuditingListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DossierPieceAttendue implements AuditableEtude {

    public static final String SOURCE_IA = "IA";
    public static final String SOURCE_MANUEL = "MANUEL";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "dossier_etude_id", nullable = false)
    private UUID dossierEtudeId;

    /** Aligné {@link DossierDocument} types + codes libres. */
    @Column(name = "type", nullable = false, length = 40)
    private String type;

    @Column(name = "libelle", nullable = false, length = 255)
    private String libelle;

    @Column(name = "obligatoire", nullable = false)
    @Builder.Default
    private Boolean obligatoire = true;

    @Column(name = "source", nullable = false, length = 20)
    private String source;

    @Column(name = "dossier_document_id")
    private UUID dossierDocumentId;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public boolean estLiee() {
        return dossierDocumentId != null;
    }

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.obligatoire == null) {
            this.obligatoire = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
