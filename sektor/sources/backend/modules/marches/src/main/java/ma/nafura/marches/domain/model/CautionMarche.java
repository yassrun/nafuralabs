package ma.nafura.marches.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "cautions_marche")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CautionMarche {

    public static final String TYPE_PROVISOIRE = "PROVISOIRE";
    public static final String TYPE_DEFINITIVE = "DEFINITIVE";
    public static final String TYPE_RG = "RG";
    public static final String TYPE_AVANCE = "AVANCE";

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_RENOUVELEE = "RENOUVELEE";
    public static final String STATUS_MAINLEVEE = "MAINLEVEE";
    public static final String STATUS_EXPIRE = "EXPIRE";
    public static final String STATUS_EN_MAINLEVEE = "EN_MAINLEVEE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "contrat_marche_id", nullable = false, length = 100)
    private String contratMarcheId;

    @Column(name = "marche_numero", length = 50)
    private String marcheNumero;

    @Column(name = "type", nullable = false, length = 30)
    private String type;

    @Column(name = "banque_partner_id", length = 100)
    private String banquePartnerId;

    @Column(name = "banque_nom", length = 255)
    private String banqueNom;

    @Column(name = "montant", nullable = false, precision = 18, scale = 4)
    private BigDecimal montant;

    @Column(name = "date_emission")
    private LocalDate dateEmission;

    @Column(name = "date_expiration")
    private LocalDate dateExpiration;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "scan_url", length = 500)
    private String scanUrl;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.status == null) {
            this.status = STATUS_ACTIVE;
        }
        if (this.montant == null) {
            this.montant = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
