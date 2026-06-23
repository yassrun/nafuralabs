package ma.nafura.rh.domain.model;

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
@Table(name = "heures_supplementaires")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeureSupplementaire {

    public static final String TYPE_HS25 = "HS25";
    public static final String TYPE_HS50 = "HS50";
    public static final String TYPE_HS100 = "HS100";

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_VALIDE = "VALIDE";
    public static final String STATUS_INTEGREE_PAIE = "INTEGREE_PAIE";
    public static final String STATUS_REJETE = "REJETE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "employe_id", nullable = false, length = 100)
    private String employeId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false, length = 10)
    private String type;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal heures;

    @Column(name = "taux_majoration", nullable = false, precision = 6, scale = 4)
    private BigDecimal tauxMajoration;

    @Column(nullable = false, precision = 18, scale = 4)
    private BigDecimal montant;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "pointage_id", length = 100)
    private String pointageId;

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
        if (status == null || status.isBlank()) {
            status = STATUS_BROUILLON;
        }
        if (heures == null) {
            heures = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
