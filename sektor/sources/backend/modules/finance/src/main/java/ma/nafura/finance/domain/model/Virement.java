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
@Table(name = "virements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Virement {

    public static final String TYPE_INTERNE = "INTERNE";
    public static final String TYPE_REMISE = "REMISE";

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_VALIDE = "VALIDE";
    public static final String STATUS_ANNULE = "ANNULE";
    public static final String STATUS_PREPARATION = "PREPARATION";
    public static final String STATUS_ENVOYE = "ENVOYE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "virement_number", nullable = false, length = 50)
    private String virementNumber;

    @Column(name = "virement_type", nullable = false, length = 20)
    private String virementType;

    @Column(name = "virement_date", nullable = false)
    private LocalDate virementDate;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "amount", nullable = false, precision = 18, scale = 4)
    private BigDecimal amount;

    @Column(name = "motif", length = 500)
    private String motif;

    @Column(name = "reference", length = 100)
    private String reference;

    @Column(name = "source_account_id")
    private UUID sourceAccountId;

    @Column(name = "source_account_label", length = 255)
    private String sourceAccountLabel;

    @Column(name = "dest_account_id")
    private UUID destAccountId;

    @Column(name = "dest_account_label", length = 255)
    private String destAccountLabel;

    @Column(name = "bank_code", length = 20)
    private String bankCode;

    @Column(name = "execution_date")
    private LocalDate executionDate;

    @Column(name = "generated_xml")
    private String generatedXml;

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
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
