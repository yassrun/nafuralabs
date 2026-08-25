package ma.nafura.chantiers.domain.activite;

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

/**
 * Activité du planning chantier — CONTRAT planning-activites AC-1..AC-3.
 * WBS libre via {@code parentActiviteId} ; zone facultative ({@link ma.nafura.chantiers.domain.chantier.ZoneChantier}).
 */
@Entity
@Table(name = "chantier_activites")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActiviteChantier {

    public static final String STATUS_PLANIFIE = "PLANIFIE";
    public static final String STATUS_EN_COURS = "EN_COURS";
    public static final String STATUS_TERMINE = "TERMINE";
    public static final String STATUS_EN_RETARD = "EN_RETARD";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "chantier_id", nullable = false, length = 100)
    private String chantierId;

    @Column(name = "parent_activite_id", length = 100)
    private String parentActiviteId;

    @Column(name = "zone_id", length = 100)
    private String zoneId;

    @Column(nullable = false, length = 500)
    private String libelle;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Column(nullable = false)
    private int ordre;

    /** % saisi seulement si aucun rattachement (AC-9) ; sinon dérivé à la lecture. */
    @Column(name = "avancement_percent", precision = 8, scale = 4)
    private BigDecimal avancementPercent;

    @Column(nullable = false, length = 30)
    private String status;

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
            status = STATUS_PLANIFIE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
