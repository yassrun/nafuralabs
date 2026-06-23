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
@Table(name = "inspections")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inspection {

    public static final String STATUS_PLANIFIEE = "PLANIFIEE";
    public static final String STATUS_EN_COURS = "EN_COURS";
    public static final String STATUS_TERMINEE = "TERMINEE";
    public static final String STATUS_ANNULEE = "ANNULEE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 50)
    private String numero;

    @Column(name = "date_inspection", nullable = false)
    private LocalDate dateInspection;

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "chantier_code", length = 50)
    private String chantierCode;

    @Column(name = "inspecteur_nom", nullable = false, length = 255)
    private String inspecteurNom;

    @Column(name = "organisme_type", length = 30)
    private String organismeType;

    @Column(name = "reference_rapport", length = 255)
    private String referenceRapport;

    @Column(nullable = false, length = 500)
    private String thematique;

    @Column(name = "nb_observations", nullable = false)
    private int nbObservations;

    @Column(name = "nb_non_conformites", nullable = false)
    private int nbNonConformites;

    @Column(name = "note_globale", precision = 5, scale = 2)
    private BigDecimal noteGlobale;

    @Column(nullable = false, length = 30)
    private String status;

    private String observations;

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
            status = STATUS_PLANIFIEE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
