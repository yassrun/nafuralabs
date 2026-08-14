package ma.nafura.finance.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "lettrage_lines")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LettrageLine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "lettrage_id", nullable = false)
    private UUID lettrageId;

    @Column(name = "journal_entry_id", nullable = false)
    private UUID journalEntryId;

    @Column(name = "journal_entry_line_id", nullable = false)
    private UUID journalEntryLineId;

    @Column(name = "debit", nullable = false, precision = 18, scale = 4)
    private BigDecimal debit;

    @Column(name = "credit", nullable = false, precision = 18, scale = 4)
    private BigDecimal credit;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
    }
}
