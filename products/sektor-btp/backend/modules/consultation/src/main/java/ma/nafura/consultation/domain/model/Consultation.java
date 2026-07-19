package ma.nafura.consultation.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A supplier consultation built from a CPS + bordereau de prix.
 * The enriched bordereau tree (lots -> sous-lots -> postes) is held by
 * {@link ConsultationNoeud}; per-poste decomposition by {@link ConsultationComposant}.
 */
@Entity
@Table(name = "consultations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Consultation {

    public static final String STATUS_BROUILLON = "BROUILLON";
    /** @deprecated Prefer EN_CHIFFRAGE / EN_VALIDATION wizard flow. Kept for legacy rows. */
    public static final String STATUS_A_VALIDER = "A_VALIDER";
    /** @deprecated Prefer TERMINE. Kept for legacy rows. */
    public static final String STATUS_VALIDEE = "VALIDEE";
    public static final String STATUS_EN_CHIFFRAGE = "EN_CHIFFRAGE";
    public static final String STATUS_EN_VALIDATION = "EN_VALIDATION";
    public static final String STATUS_TERMINE = "TERMINE";
    public static final String STATUS_CONVERTIE = "CONVERTIE";
    public static final String STATUS_ANNULEE = "ANNULEE";

    /** Wizard steps: 1=bordereau, 2=décomposition, 3=chiffrage. */
    public static final int STEP_BORDEREAU = 1;
    public static final int STEP_DECOMPOSITION = 2;
    public static final int STEP_CHIFFRAGE = 3;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "objet", nullable = false, length = 500)
    private String objet;

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "chantier_code", length = 50)
    private String chantierCode;

    @Column(name = "chantier_name", length = 255)
    private String chantierName;

    @Column(name = "cps_document_id", length = 100)
    private String cpsDocumentId;

    @Column(name = "bordereau_document_id", length = 100)
    private String bordereauDocumentId;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    /** Current wizard step (1..3). */
    @Column(name = "current_step", nullable = false)
    @Builder.Default
    private Integer currentStep = STEP_BORDEREAU;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    /** Root tree nodes, assembled by the service layer (not a JPA relationship). */
    @Transient
    @JsonProperty("arbre")
    @Builder.Default
    private List<ConsultationNoeud> arbre = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.status == null) {
            this.status = STATUS_BROUILLON;
        }
        if (this.currentStep == null) {
            this.currentStep = STEP_BORDEREAU;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
