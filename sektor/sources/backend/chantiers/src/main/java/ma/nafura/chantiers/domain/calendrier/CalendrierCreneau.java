package ma.nafura.chantiers.domain.calendrier;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Créneau hebdomadaire non chevauchant. {@code lendemain=true} : shift nuit
 * (ex. lundi 22:00 → mardi 06:00). Réservation ressource = L3.
 */
@Entity
@Table(name = "chantier_calendrier_creneaux")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendrierCreneau {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "version_id", nullable = false, length = 100)
    private String versionId;

    /** ISO-8601 : 1 = lundi … 7 = dimanche. */
    @Column(name = "jour_semaine", nullable = false)
    private int jourSemaine;

    @Column(name = "heure_debut", nullable = false)
    private LocalTime heureDebut;

    @Column(name = "heure_fin", nullable = false)
    private LocalTime heureFin;

    @Column(nullable = false)
    @Builder.Default
    private boolean lendemain = false;
}
