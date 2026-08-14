package ma.nafura.marches.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "revisions_prix")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevisionPrix {

    public static final String STATUS_CALCULE = "CALCULE";
    public static final String STATUS_APPLIQUE = "APPLIQUE";
    public static final String STATUS_ANNULE = "ANNULE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "contrat_marche_id", nullable = false, length = 100)
    private String contratMarcheId;

    @Column(name = "periode", nullable = false, length = 7)
    private String periode;

    @Column(name = "coefficient_k", precision = 18, scale = 8)
    private BigDecimal coefficientK;

    @Column(name = "montant_revision", precision = 18, scale = 4)
    private BigDecimal montantRevision;

    @Column(name = "formule_json", columnDefinition = "TEXT")
    private String formuleJson;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.status == null) {
            this.status = STATUS_CALCULE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
