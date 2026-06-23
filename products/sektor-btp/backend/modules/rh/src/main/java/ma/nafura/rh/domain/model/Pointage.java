package ma.nafura.rh.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
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
@Table(name = "pointages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pointage {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_VALIDE = "VALIDE";
    public static final String STATUS_CONTESTE = "CONTESTE";

    public static final String MODE_PRESENT = "PRESENT";
    public static final String MODE_ABSENT = "ABSENT";
    public static final String MODE_CONGE = "CONGE";
    public static final String MODE_MALADIE = "MALADIE";
    public static final String MODE_FORMATION = "FORMATION";
    public static final String MODE_AUTRE = "AUTRE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "batch_id", nullable = false, length = 100)
    private String batchId;

    @Column(name = "employe_id", nullable = false, length = 100)
    private String employeId;

    @Column(name = "chantier_id", nullable = false, length = 100)
    private String chantierId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false, length = 30)
    private String mode;

    @Column(name = "heure_arrivee", length = 5)
    private String heureArrivee;

    @Column(name = "heure_depart", length = 5)
    private String heureDepart;

    @Column(name = "heures_normales", nullable = false, precision = 8, scale = 2)
    private BigDecimal heuresNormales;

    @Column(name = "heures_sup", nullable = false, precision = 8, scale = 2)
    private BigDecimal heuresSup;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "poste_budgetaire_id", length = 100)
    private String posteBudgetaireId;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (heuresNormales == null) {
            heuresNormales = BigDecimal.ZERO;
        }
        if (heuresSup == null) {
            heuresSup = BigDecimal.ZERO;
        }
        if (status == null || status.isBlank()) {
            status = STATUS_BROUILLON;
        }
    }
}
