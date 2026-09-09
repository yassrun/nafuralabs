package ma.nafura.chantiers.domain.activite;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Référentiel de natures de planning — classification, pas une permission.
 * Désactivation ({@code actif=false}) sans suppression d'historique.
 */
@Entity
@Table(name = "chantier_activite_natures")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActiviteNature {

    @Id
    @Column(length = 50)
    private String code;

    @Column(nullable = false, length = 200)
    private String libelle;

    /** {@link ActiviteForme#ACTIVITE} (aussi valable pour une phase) ou {@link ActiviteForme#JALON}. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ActiviteForme forme;

    @Column(nullable = false)
    private boolean actif;

    @Column(nullable = false)
    private int ordre;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public boolean applicableA(ActiviteForme cible) {
        if (cible == null || forme == null) {
            return false;
        }
        if (forme == ActiviteForme.JALON) {
            return cible == ActiviteForme.JALON;
        }
        return cible == ActiviteForme.ACTIVITE || cible == ActiviteForme.PHASE;
    }

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
