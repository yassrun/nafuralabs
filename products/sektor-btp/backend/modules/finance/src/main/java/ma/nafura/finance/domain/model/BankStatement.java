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
@Table(name = "bank_statements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankStatement {

    public static final String STATUS_EN_COURS = "EN_COURS";
    public static final String STATUS_VALIDE = "VALIDE";
    public static final String STATUS_ANOMALIE = "ANOMALIE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "bank_account_id", nullable = false)
    private UUID bankAccountId;

    @Column(name = "statement_number", nullable = false, length = 50)
    private String statementNumber;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "opening_balance_accounting", nullable = false, precision = 18, scale = 4)
    private BigDecimal openingBalanceAccounting;

    @Column(name = "closing_balance_accounting", nullable = false, precision = 18, scale = 4)
    private BigDecimal closingBalanceAccounting;

    @Column(name = "closing_balance_statement", nullable = false, precision = 18, scale = 4)
    private BigDecimal closingBalanceStatement;

    @Column(name = "variance", nullable = false, precision = 18, scale = 4)
    private BigDecimal variance;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "imported_file_name", length = 255)
    private String importedFileName;

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
            this.status = STATUS_EN_COURS;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
