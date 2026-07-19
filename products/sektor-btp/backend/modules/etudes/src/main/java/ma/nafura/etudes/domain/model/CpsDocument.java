package ma.nafura.etudes.domain.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Un CPS extrait et indexe, rattache a la piece du marche dont il provient. */
@Entity
@Table(name = "cps_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CpsDocument {

    /** Couche texte dense : extraction fiable, aucun token LLM consomme. */
    public static final String QUALITE_PDF_NATIF = "PDF_NATIF";
    /** Couche texte presente mais bruitee : exploitable, precision variable. */
    public static final String QUALITE_SCAN_OCR = "SCAN_OCR";
    /** Aucun texte extractible. Extraction indisponible aujourd'hui ; conversion prevue. */
    public static final String QUALITE_SCAN_IMAGE = "SCAN_IMAGE";
    public static final String QUALITE_INCONNUE = "INCONNUE";

    public static final String STATUT_EN_ATTENTE = "EN_ATTENTE";
    public static final String STATUT_EN_COURS = "EN_COURS";
    public static final String STATUT_TERMINE = "TERMINE";
    public static final String STATUT_ECHEC = "ECHEC";
    /** Document accepte et conserve, mais non indexable en l'etat (scan pur). */
    public static final String STATUT_NON_SUPPORTE = "NON_SUPPORTE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "dossier_document_id", nullable = false)
    private UUID dossierDocumentId;

    @Column(name = "nb_pages")
    private Integer nbPages;

    @Column(name = "qualite_source", nullable = false, length = 20)
    private String qualiteSource;

    /** Caracteres par page. Sert a mesurer, sur de vrais CPS, la part de scans a traiter. */
    @Column(name = "densite_texte")
    private Integer densiteTexte;

    @Column(name = "statut_extraction", nullable = false, length = 20)
    private String statutExtraction;

    @Column(name = "message_extraction", length = 500)
    private String messageExtraction;

    @Column(name = "nb_sections", nullable = false)
    @Builder.Default
    private Integer nbSections = 0;

    @Column(name = "extrait_le")
    private OffsetDateTime extraitLe;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    /** Le CPS est-il interrogeable ? */
    public boolean estIndexe() {
        return STATUT_TERMINE.equals(statutExtraction) && nbSections != null && nbSections > 0;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        if (this.statutExtraction == null) {
            this.statutExtraction = STATUT_EN_ATTENTE;
        }
        if (this.qualiteSource == null) {
            this.qualiteSource = QUALITE_INCONNUE;
        }
        if (this.nbSections == null) {
            this.nbSections = 0;
        }
    }
}
