package ma.nafura.hse.domain.model;

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

@Entity
@Table(name = "audits_hse")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditHse {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_EN_COURS = "EN_COURS";
    public static final String STATUS_CLOTURE = "CLOTURE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 50)
    private String numero;

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "chantier_code", length = 50)
    private String chantierCode;

    @Column(name = "template_code", length = 50)
    private String templateCode;

    @Column(nullable = false, length = 500)
    private String titre;

    @Column(name = "auditeur_nom", nullable = false, length = 255)
    private String auditeurNom;

    @Column(name = "date_audit", nullable = false)
    private LocalDate dateAudit;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "score_global", precision = 5, scale = 2)
    private BigDecimal scoreGlobal;

    private String notes;

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
            status = STATUS_BROUILLON;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
