package ma.nafura.chantiers.domain.activite;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * Ligne du planning chantier — CONTRAT planning-activites AC-1..AC-3, étendu L1 (SEKTOR-325).
 * WBS libre via {@code parentActiviteId} ; zone facultative ({@link ma.nafura.chantiers.domain.chantier.ZoneChantier}).
 * Forme / nature / durée ouvrée : gel 08/09. Dates {@code dateDebut}/{@code dateFin} = dates
 * <em>visibles</em> (fin incluse historique) — ne pas les décaler.
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

    /** Code lisible facultatif — distinct de l'id technique. */
    @Column(length = 80)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ActiviteForme forme = ActiviteForme.ACTIVITE;

    /** Classification ; null = à qualifier. Référentiel {@link ActiviteNature}. */
    @Column(name = "nature_code", length = 50)
    private String natureCode;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    /** Date de fin <em>visible</em> (fin incluse historique). */
    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    /**
     * Durée opérationnelle en minutes ouvrées. Null = à qualifier (lignes migrées).
     * Jalon = 0. Phase = null (dates dérivées à la lecture, pas une durée manuelle).
     */
    @Column(name = "duree_minutes_ouvrees")
    private Integer dureeMinutesOuvrees;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "calendrier_specifique", columnDefinition = "jsonb")
    private ma.nafura.chantiers.domain.calendrier.CalendrierActivite calendrierSpecifique;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "planning_allocations", columnDefinition = "jsonb")
    private java.util.List<PlanningAllocation> planningAllocations;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "planning_needs", columnDefinition = "jsonb")
    private java.util.List<PlanningNeed> planningNeeds;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name="planning_remainder",columnDefinition="jsonb")
    private PlanningRemainder planningRemainder;

    public boolean plannedOn(LocalDate day) {
        return !day.isBefore(dateDebut) && !day.isAfter(dateFin) && (planningRemainder==null || planningRemainder.includes(day));
    }

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
        if (forme == null) {
            forme = ActiviteForme.ACTIVITE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
