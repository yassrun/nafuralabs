package ma.nafura.marches.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "receptions_marche")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceptionMarche {

    public static final String TYPE_PROVISOIRE = "PROVISOIRE";
    public static final String TYPE_DEFINITIVE = "DEFINITIVE";

    public static final String STATUS_VALIDE = "VALIDE";
    public static final String STATUS_ANNULEE = "ANNULEE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "contrat_marche_id", nullable = false, length = 100)
    private String contratMarcheId;

    @Column(name = "type", nullable = false, length = 30)
    private String type;

    @Column(name = "date_reception", nullable = false)
    private LocalDate dateReception;

    @Column(name = "pv_reference", length = 100)
    private String pvReference;

    @Column(name = "status", nullable = false, length = 30)
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
        if (status == null) {
            status = STATUS_VALIDE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
