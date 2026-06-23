package ma.nafura.chantiers.domain.model;

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
import org.springframework.util.StringUtils;

@Entity
@Table(name = "attachements_chantier")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttachementChantier {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_EN_ATTENTE_MOE = "EN_ATTENTE_MOE";
    public static final String STATUS_SIGNE_MOE = "SIGNE_MOE";
    public static final String STATUS_EN_ATTENTE_MOA = "EN_ATTENTE_MOA";
    public static final String STATUS_CONTRESIGNE_MOA = "CONTRESIGNE_MOA";
    public static final String STATUS_CONTESTE = "CONTESTE";
    public static final String STATUS_CLOS = "CLOS";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "chantier_id", nullable = false, length = 100)
    private String chantierId;

    @Column(nullable = false, length = 120)
    private String numero;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "meteo_code", length = 20)
    private String meteoCode;

    @Column(name = "temperature_c")
    private Integer temperatureC;

    @Column(name = "effectif_present", nullable = false)
    private Integer effectifPresent;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "signature_moe_data_url", columnDefinition = "TEXT")
    private String signatureMoeDataUrl;

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
        if (effectifPresent == null) {
            effectifPresent = 0;
        }
        if (!StringUtils.hasText(status)) {
            status = STATUS_BROUILLON;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
