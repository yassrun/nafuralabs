package ma.nafura.chantiers.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "attachement_lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttachementLigne {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "attachement_id", nullable = false, length = 100)
    private String attachementId;

    @Column(name = "poste_code", nullable = false, length = 50)
    private String posteCode;

    @Column(nullable = false, length = 500)
    private String designation;

    @Column(name = "quantite_executee", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantiteExecutee;

    @Column(nullable = false, length = 30)
    private String unite;

    @Column(length = 200)
    private String zone;

    @Column(nullable = false)
    private Integer ordre;

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
        if (quantiteExecutee == null) {
            quantiteExecutee = BigDecimal.ZERO;
        }
        if (ordre == null) {
            ordre = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
