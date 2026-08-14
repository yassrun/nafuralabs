package ma.nafura.etudes.domain.avis;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "avis_execution")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvisExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "dossier_etude_id", nullable = false)
    private UUID dossierEtudeId;

    @Column(name = "dpgf_noeud_id", nullable = false)
    private UUID dpgfNoeudId;

    /** REALISABLE | DIFFICILE | IRREALISABLE */
    @Column(name = "niveau", nullable = false, length = 20)
    private String niveau;

    @Column(name = "commentaire", length = 2000)
    private String commentaire;

    @Column(name = "ecart_propose", precision = 18, scale = 4)
    private BigDecimal ecartPropose;

    @Column(name = "auteur_user_id", nullable = false, length = 100)
    private String auteurUserId;

    @Column(name = "auteur_nom", length = 255)
    private String auteurNom;

    /** OUVERT | PRIS_EN_COMPTE | ECARTE */
    @Column(name = "statut", nullable = false, length = 20)
    private String statut;

    @Column(name = "motif_traitement", length = 2000)
    private String motifTraitement;

    @Column(name = "traite_par", length = 100)
    private String traitePar;

    @Column(name = "traite_le")
    private OffsetDateTime traiteLe;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (statut == null) {
            statut = "OUVERT";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
