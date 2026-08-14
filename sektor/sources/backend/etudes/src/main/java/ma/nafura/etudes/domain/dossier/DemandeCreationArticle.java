package ma.nafura.etudes.domain.dossier;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "demande_creation_article")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeCreationArticle {

    public static final String STATUT_OUVERTE = "OUVERTE";
    public static final String STATUT_APPROUVEE = "APPROUVEE";
    public static final String STATUT_REFUSEE = "REFUSEE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "dossier_etude_id", nullable = false)
    private UUID dossierEtudeId;

    @Column(name = "libelle", nullable = false, length = 500)
    private String libelle;

    @Column(name = "nature", nullable = false, length = 30)
    private String nature;

    @Column(name = "uom_code", length = 30)
    private String uomCode;

    @Column(name = "statut", nullable = false, length = 20)
    private String statut;

    @Column(name = "auteur_user_id", length = 100)
    private String auteurUserId;

    /** JSON array of composant UUIDs. */
    @Column(name = "composant_ids_json", nullable = false, columnDefinition = "TEXT")
    private String composantIdsJson;

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
            statut = STATUT_OUVERTE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
