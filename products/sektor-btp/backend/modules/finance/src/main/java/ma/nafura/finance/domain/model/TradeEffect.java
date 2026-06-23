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
@Table(name = "trade_effects")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TradeEffect {

    public static final String TYPE_LCR = "LCR";
    public static final String TYPE_LCN = "LCN";

    public static final String STATUS_PORTEFEUILLE = "PORTEFEUILLE";
    public static final String STATUS_REMIS_ENCAISSEMENT = "REMIS_ENCAISSEMENT";
    public static final String STATUS_ESCOMPTE = "ESCOMPTE";
    public static final String STATUS_PAYE = "PAYE";
    public static final String STATUS_IMPAYE = "IMPAYE";
    public static final String STATUS_PROTESTE = "PROTESTE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "effect_number", nullable = false, length = 50)
    private String effectNumber;

    @Column(name = "effect_type", nullable = false, length = 10)
    private String effectType;

    @Column(name = "invoice_id", nullable = false, length = 100)
    private String invoiceId;

    @Column(name = "client_id", nullable = false, length = 100)
    private String clientId;

    @Column(name = "client_name", length = 255)
    private String clientName;

    @Column(name = "domicile_bank", nullable = false, length = 50)
    private String domicileBank;

    @Column(name = "drawn_bank_id", length = 100)
    private String drawnBankId;

    @Column(name = "amount", nullable = false, precision = 18, scale = 4)
    private BigDecimal amount;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "remittance_date")
    private LocalDate remittanceDate;

    @Column(name = "discount_date")
    private LocalDate discountDate;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "discount_fee", precision = 18, scale = 4)
    private BigDecimal discountFee;

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
            this.status = STATUS_PORTEFEUILLE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
