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
@Table(name = "bank_statement_lines")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankStatementLine {

    public static final String MATCH_UNMATCHED = "UNMATCHED";
    public static final String MATCH_MATCHED = "MATCHED";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "bank_statement_id", nullable = false)
    private UUID bankStatementId;

    @Column(name = "line_date", nullable = false)
    private LocalDate lineDate;

    @Column(name = "label", nullable = false, length = 500)
    private String label;

    @Column(name = "reference", length = 100)
    private String reference;

    @Column(name = "receipt_amount", nullable = false, precision = 18, scale = 4)
    private BigDecimal receiptAmount;

    @Column(name = "payment_amount", nullable = false, precision = 18, scale = 4)
    private BigDecimal paymentAmount;

    @Column(name = "matched_journal_entry_id")
    private UUID matchedJournalEntryId;

    @Column(name = "matched_journal_entry_line_id")
    private UUID matchedJournalEntryLineId;

    @Column(name = "matched_mouvement_ref", length = 100)
    private String matchedMouvementRef;

    @Column(name = "match_status", nullable = false, length = 20)
    private String matchStatus;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.matchStatus == null) {
            this.matchStatus = MATCH_UNMATCHED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
