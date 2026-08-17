package ma.nafura.etudes.domain.dossier;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Une piece du marche rattachee a un dossier d'etude.
 *
 * <p>Une table plutot que deux colonnes fixes sur {@link DossierEtude} : la realite varie. Un
 * seul PDF contenant CPS et bordereau, ou trois fichiers separes, ou un CPS accompagne d'un CPT
 * et de plans. Le type {@code CPS_ET_BORDEREAU} declenche les deux traitements sur le meme
 * fichier.
 *
 * <p>{@code documentId} pointe vers l'ORIGINAL stocke par doc-manager. Il n'est jamais altere :
 * le CPS est un document contractuel, toute extraction n'en est qu'une lecture.
 */
@Entity
@Table(name = "dossier_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DossierDocument {

    public static final String TYPE_CPS = "CPS";
    public static final String TYPE_BORDEREAU = "BORDEREAU";
    public static final String TYPE_CPS_ET_BORDEREAU = "CPS_ET_BORDEREAU";
    public static final String TYPE_CPT = "CPT";
    public static final String TYPE_PLAN = "PLAN";
    public static final String TYPE_REGLEMENT = "REGLEMENT";
    public static final String TYPE_AUTRE = "AUTRE";
    public static final String TYPE_DEVIS_FOURNISSEUR = "DEVIS_FOURNISSEUR";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "dossier_etude_id", nullable = false)
    private UUID dossierEtudeId;

    /** Reference doc-manager vers le fichier original. */
    @Column(name = "document_id", nullable = false, length = 100)
    private String documentId;

    @Column(name = "nom_fichier", length = 255)
    private String nomFichier;

    @Column(name = "type", nullable = false, length = 30)
    private String type;

    @Column(name = "ordre", nullable = false)
    @Builder.Default
    private Integer ordre = 0;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    /** Ce document doit-il alimenter l'index CPS ? */
    public boolean contientCps() {
        return TYPE_CPS.equals(type) || TYPE_CPS_ET_BORDEREAU.equals(type);
    }

    /** Ce document doit-il alimenter la structuration du bordereau ? */
    public boolean contientBordereau() {
        return TYPE_BORDEREAU.equals(type) || TYPE_CPS_ET_BORDEREAU.equals(type);
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        if (this.ordre == null) {
            this.ordre = 0;
        }
    }
}
