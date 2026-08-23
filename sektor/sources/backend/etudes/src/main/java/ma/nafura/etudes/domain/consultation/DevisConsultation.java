package ma.nafura.etudes.domain.consultation;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Devis reçu, lié à la consultation études <b>et</b> à une fiche fournisseur.
 * Un fournisseur = au plus un devis qui compte. Un PDF dossier orphelin n'en est pas un.
 */
@Entity
@Table(name = "devis_consultation")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DevisConsultation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "consultation_id", nullable = false)
    private UUID consultationId;

    @Column(name = "partenaire_id", nullable = false)
    private UUID partenaireId;

    /** Pièce liée (optionnel). Sans ce lien, un {@code DEVIS_FOURNISSEUR} dossier ne compte pas. */
    @Column(name = "document_id")
    private UUID documentId;

    @Column(name = "recu_at", nullable = false)
    private OffsetDateTime recuAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "devis_consultation_id", nullable = false)
    @OrderBy("ordre ASC")
    @Builder.Default
    private List<DevisConsultationLigne> lignes = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public boolean hasLignes() {
        return lignes != null && !lignes.isEmpty();
    }

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (recuAt == null) {
            recuAt = now;
        }
        if (lignes == null) {
            lignes = new ArrayList<>();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
