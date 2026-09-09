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

/** Créneaux d'une ouverture exceptionnelle (obligatoires si type=OUVERTURE). */
@Entity
@Table(name = "chantier_calendrier_exception_creneaux")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendrierExceptionCreneau {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "exception_id", nullable = false, length = 100)
    private String exceptionId;

    @Column(name = "heure_debut", nullable = false)
    private LocalTime heureDebut;

    @Column(name = "heure_fin", nullable = false)
    private LocalTime heureFin;

    @Column(nullable = false)
    @Builder.Default
    private boolean lendemain = false;
}
