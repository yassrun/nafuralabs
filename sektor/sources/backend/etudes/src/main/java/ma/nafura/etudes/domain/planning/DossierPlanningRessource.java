package ma.nafura.etudes.domain.planning;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "dossier_planning_ressources")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DossierPlanningRessource {

    public static final String TYPE_HUMAIN = "HUMAIN";
    public static final String TYPE_MATERIEL = "MATERIEL";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "dossier_id", nullable = false)
    private UUID dossierId;

    @Column(name = "type", nullable = false, length = 20)
    private String type;

    @Column(name = "libelle", nullable = false, length = 255)
    private String libelle;

    @Column(name = "quantite", nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal quantite = BigDecimal.ONE;

    @Column(name = "unite", length = 30)
    private String unite;

    @Column(name = "employe_id", length = 100)
    private String employeId;

    @Column(name = "materiel_id", length = 100)
    private String materielId;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "ordre", nullable = false)
    @Builder.Default
    private int ordre = 0;

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
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
