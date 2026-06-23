package ma.nafura.rh.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pointage_batches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointageBatch {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_SOUMIS = "SOUMIS";
    public static final String STATUS_VALIDE = "VALIDE";
    public static final String STATUS_REJETE = "REJETE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "client_id")
    private UUID clientId;

    @Column(name = "chef_employe_id", nullable = false, length = 100)
    private String chefEmployeId;

    @Column(name = "chantier_id", nullable = false, length = 100)
    private String chantierId;

    @Column(name = "date_pointage", nullable = false)
    private LocalDate datePointage;

    @Column(name = "gps_lat", precision = 10, scale = 7)
    private BigDecimal gpsLat;

    @Column(name = "gps_lng", precision = 10, scale = 7)
    private BigDecimal gpsLng;

    @Column(name = "signature_url", length = 500)
    private String signatureUrl;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (status == null || status.isBlank()) {
            status = STATUS_BROUILLON;
        }
    }
}
