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
@Table(name = "reglements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reglement {

    public static final String TYPE_ENCAISSEMENT_CLIENT = "ENCAISSEMENT_CLIENT";
    public static final String TYPE_PAIEMENT_FOURNISSEUR = "PAIEMENT_FOURNISSEUR";
    public static final String TYPE_PAIEMENT_EMPLOYE = "PAIEMENT_EMPLOYE";

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_VALIDE = "VALIDE";
    public static final String STATUS_ANNULE = "ANNULE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "reglement_type", nullable = false, length = 30)
    private String reglementType;

    @Column(name = "reglement_date", nullable = false)
    private LocalDate reglementDate;

    @Column(name = "payment_mode_code", nullable = false, length = 30)
    private String paymentModeCode;

    @Column(name = "reference", length = 100)
    private String reference;

    @Column(name = "issuing_bank", length = 200)
    private String issuingBank;

    @Column(name = "partner_id", nullable = false, length = 100)
    private String partnerId;

    @Column(name = "partner_name", length = 255)
    private String partnerName;

    @Column(name = "financial_account_id", nullable = false, length = 50)
    private String financialAccountId;

    @Column(name = "financial_account_label", length = 255)
    private String financialAccountLabel;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalAmount;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "journal_entry_id")
    private UUID journalEntryId;

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
            this.status = STATUS_BROUILLON;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
