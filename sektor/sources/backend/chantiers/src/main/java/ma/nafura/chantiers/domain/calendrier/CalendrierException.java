package ma.nafura.chantiers.domain.calendrier;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Exception datée (priorité sur la semaine type). Fermeture = portions de cette date locale. */
@Entity
@Table(name = "chantier_calendrier_exceptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendrierException {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "version_id", nullable = false, length = 100)
    private String versionId;

    @Column(name = "date_locale", nullable = false)
    private LocalDate dateLocale;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CalendrierExceptionType type;
}
