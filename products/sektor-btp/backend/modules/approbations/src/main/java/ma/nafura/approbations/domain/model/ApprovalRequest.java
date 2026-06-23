package ma.nafura.approbations.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity(name = "ErpApprovalRequest")
@Table(name = "erp_approval_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalRequest {

    public static final String STATUS_EN_COURS = "EN_COURS";
    public static final String STATUS_EN_ATTENTE = "EN_ATTENTE";
    public static final String STATUS_APPROUVE = "APPROUVE";
    public static final String STATUS_REJETE = "REJETE";
    public static final String STATUS_ANNULE = "ANNULE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "workflow_id", nullable = false, length = 100)
    private String workflowId;

    @Column(name = "entity_type", nullable = false, length = 30)
    private String entityType;

    @Column(name = "entity_id", nullable = false, length = 100)
    private String entityId;

    @Column(name = "entity_ref", nullable = false, length = 100)
    private String entityRef;

    @Column(name = "entity_summary", nullable = false, columnDefinition = "TEXT")
    private String entitySummary;

    @Column(name = "montant_concerne", precision = 18, scale = 4)
    private BigDecimal montantConcerne;

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "initiateur_user_id", nullable = false, length = 100)
    private String initiateurUserId;

    @Column(name = "initiateur_nom", nullable = false)
    private String initiateurNom;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "etape_courante_index", nullable = false)
    private Integer etapeCouranteIndex;

    @Column(name = "date_soumission", nullable = false)
    private LocalDate dateSoumission;

    @Column(name = "date_cloture")
    private LocalDate dateCloture;

    @Column(nullable = false, length = 20)
    private String urgence;

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
        if (status == null) {
            status = STATUS_EN_COURS;
        }
        if (etapeCouranteIndex == null) {
            etapeCouranteIndex = 0;
        }
        if (urgence == null) {
            urgence = "NORMALE";
        }
        if (dateSoumission == null) {
            dateSoumission = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
