package ma.nafura.chantiers.domain.activite;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Lien de précédence entre activités — AC-4 (FD obligatoire ; DD/FF/DF supportés). */
@Entity
@Table(name = "chantier_activite_precedences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivitePrecedence {

    public static final String FD = "FD";
    public static final String DD = "DD";
    public static final String FF = "FF";
    public static final String DF = "DF";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "chantier_id", nullable = false, length = 100)
    private String chantierId;

    @Column(name = "pred_activite_id", nullable = false, length = 100)
    private String predActiviteId;

    @Column(name = "succ_activite_id", nullable = false, length = 100)
    private String succActiviteId;

    @Column(name = "type_lien", nullable = false, length = 10)
    private String typeLien;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
