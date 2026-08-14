package ma.nafura.finance.domain.model;

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
@Table(name = "caisses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Caisse {

    public static final String TYPE_CENTRALE = "CENTRALE";
    public static final String TYPE_CHANTIER = "CHANTIER";

    public static final String STATUS_OUVERTE = "OUVERTE";
    public static final String STATUS_FERMEE = "FERMEE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "caisse_type", nullable = false, length = 20)
    private String caisseType;

    @Column(name = "code", length = 30)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "chantier_label", length = 255)
    private String chantierLabel;

    @Column(name = "chef_chantier_id", length = 100)
    private String chefChantierId;

    @Column(name = "chef_chantier_name", length = 255)
    private String chefChantierName;

    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode;

    @Column(name = "gl_account_code", length = 50)
    private String glAccountCode;

    @Column(name = "opening_balance", nullable = false, precision = 18, scale = 4)
    private BigDecimal openingBalance;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "opened_at")
    private LocalDate openedAt;

    @Column(name = "closed_at")
    private LocalDate closedAt;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.status == null) {
            this.status = STATUS_OUVERTE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
