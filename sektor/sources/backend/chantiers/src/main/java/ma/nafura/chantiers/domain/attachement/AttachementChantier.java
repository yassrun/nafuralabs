package ma.nafura.chantiers.domain.attachement;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.util.StringUtils;

@Entity
@Table(name = "attachements_chantier")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttachementChantier {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_EN_ATTENTE_MOE = "EN_ATTENTE_MOE";
    public static final String STATUS_SIGNE_MOE = "SIGNE_MOE";
    public static final String STATUS_EN_ATTENTE_MOA = "EN_ATTENTE_MOA";
    public static final String STATUS_CONTRESIGNE_MOA = "CONTRESIGNE_MOA";
    public static final String STATUS_CONTESTE = "CONTESTE";
    public static final String STATUS_CLOS = "CLOS";

    /**
     * AC-15 — la signature MOE fige tout : ses lignes, sa période, et les déclarations qu'il
     * reprend (AC-7 du contrat avancement-et-attachement). Tout statut atteint à partir de
     * {@code SIGNE_MOE} est figeant ; {@code BROUILLON} et {@code EN_ATTENTE_MOE} ne le sont pas
     * encore (AC-17 — le désaccord s'y règle par retour à la déclaration).
     */
    public static final List<String> STATUTS_FIGES = List.of(
            STATUS_SIGNE_MOE, STATUS_EN_ATTENTE_MOA, STATUS_CONTRESIGNE_MOA, STATUS_CONTESTE, STATUS_CLOS);

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "chantier_id", nullable = false, length = 100)
    private String chantierId;

    @Column(nullable = false, length = 120)
    private String numero;

    /** AC-10 — l'attachement couvre une période, pas un jour. Bornes incluses. */
    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Column(name = "meteo_code", length = 20)
    private String meteoCode;

    @Column(name = "temperature_c")
    private Integer temperatureC;

    @Column(name = "effectif_present", nullable = false)
    private Integer effectifPresent;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "signature_moe_data_url", columnDefinition = "TEXT")
    private String signatureMoeDataUrl;

    /**
     * Contrat {@code situation-et-retenues}, AC-4 — l'attachement une fois consommé par une
     * situation ne l'est plus jamais par une suivante. {@code null} tant qu'aucune situation ne
     * l'a repris.
     */
    @Column(name = "situation_id", length = 100)
    private String situationId;

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
        updatedAt = now;
        if (effectifPresent == null) {
            effectifPresent = 0;
        }
        if (!StringUtils.hasText(status)) {
            status = STATUS_BROUILLON;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
