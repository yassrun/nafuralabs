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
@Table(name = "journal_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalEntry {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_POSTE = "POSTE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "entry_number", nullable = false, length = 50)
    private String entryNumber;

    @Column(name = "journal_id", nullable = false)
    private UUID journalId;

    @Column(name = "journal_code", nullable = false, length = 20)
    private String journalCode;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(name = "fiscal_year", nullable = false)
    private Integer fiscalYear;

    @Column(name = "period", nullable = false)
    private Integer period;

    @Column(name = "reference", length = 100)
    private String reference;

    @Column(name = "label", nullable = false, length = 500)
    private String label;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "origin", length = 50)
    private String origin;

    @Column(name = "origin_id", length = 100)
    private String originId;

    @Column(name = "total_debit", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalDebit;

    @Column(name = "total_credit", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalCredit;

    @Column(name = "validated_at")
    private OffsetDateTime validatedAt;

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
