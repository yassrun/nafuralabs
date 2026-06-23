package ma.nafura.achats.domain.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "attestations_fournisseur")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttestationFournisseur {

    public static final String TYPE_CNSS = "CNSS";
    public static final String TYPE_FISCALE = "FISCALE";
    public static final String TYPE_AMO = "AMO";
    public static final String TYPE_RC = "RC";
    public static final String TYPE_IF = "IF";
    public static final String TYPE_ICE = "ICE";
    public static final String TYPE_PATENTE = "PATENTE";
    public static final String TYPE_RIB = "RIB";

    public static final List<String> ALL_TYPES =
            List.of(TYPE_CNSS, TYPE_FISCALE, TYPE_AMO, TYPE_RC, TYPE_IF, TYPE_ICE, TYPE_PATENTE, TYPE_RIB);

    public static final String STATUS_VALIDE = "VALIDE";
    public static final String STATUS_EXPIRE_BIENTOT = "EXPIRE_BIENTOT";
    public static final String STATUS_EXPIRE = "EXPIRE";

    public static final int EXPIRE_BIENTOT_DAYS = 30;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "partner_id", nullable = false, length = 100)
    private String partnerId;

    @Column(name = "type", nullable = false, length = 20)
    private String type;

    @Column(name = "date_emission", nullable = false)
    private LocalDate dateEmission;

    @Column(name = "date_expiration", nullable = false)
    private LocalDate dateExpiration;

    @Column(name = "scan_url")
    private String scanUrl;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.status == null) {
            this.status = STATUS_VALIDE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
