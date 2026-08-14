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
@Table(name = "virement_lines")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VirementLine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "virement_id", nullable = false)
    private UUID virementId;

    @Column(name = "line_number", nullable = false)
    private Integer lineNumber;

    @Column(name = "beneficiary_name", nullable = false, length = 255)
    private String beneficiaryName;

    @Column(name = "beneficiary_rib", nullable = false, length = 50)
    private String beneficiaryRib;

    @Column(name = "amount", nullable = false, precision = 18, scale = 4)
    private BigDecimal amount;

    @Column(name = "motif", nullable = false, length = 500)
    private String motif;

    @Column(name = "reference_piece", length = 100)
    private String referencePiece;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
    }
}
