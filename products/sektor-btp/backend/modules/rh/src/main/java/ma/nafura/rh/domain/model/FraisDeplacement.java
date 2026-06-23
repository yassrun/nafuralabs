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
@Table(name = "frais_deplacement")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FraisDeplacement {

    public static final String TYPE_INDEMNITE_KM = "INDEMNITE_KM";
    public static final String TYPE_PANIER_REPAS = "PANIER_REPAS";
    public static final String TYPE_HEBERGEMENT = "HEBERGEMENT";

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_SOUMIS = "SOUMIS";
    public static final String STATUS_APPROUVE = "APPROUVE";
    public static final String STATUS_REJETE = "REJETE";
    public static final String STATUS_INTEGRE = "INTEGRE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "employe_id", nullable = false, length = 100)
    private String employeId;

    @Column(name = "employe_nom", length = 255)
    private String employeNom;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false, precision = 18, scale = 4)
    private BigDecimal montant;

    @Column(precision = 10, scale = 2)
    private BigDecimal km;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "motif_rejet")
    private String motifRejet;

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
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
