package ma.nafura.chantiers.domain.calendrier;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Version à date d'effet : fuseau + semaine type + exceptions. */
@Entity
@Table(name = "chantier_calendrier_versions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendrierVersion {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "calendrier_id", nullable = false, length = 100)
    private String calendrierId;

    @Column(name = "date_effet", nullable = false)
    private LocalDate dateEffet;

    @Column(name = "fuseau_iana", nullable = false, length = 80)
    private String fuseauIana;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
