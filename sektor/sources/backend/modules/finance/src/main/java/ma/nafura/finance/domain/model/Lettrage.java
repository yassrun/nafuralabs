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
@Table(name = "lettrages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lettrage {

    public static final String STATUS_EQUILIBRE = "EQUILIBRE";
    public static final String STATUS_PARTIEL = "PARTIEL";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "code", nullable = false, length = 10)
    private String code;

    @Column(name = "account_radical", nullable = false, length = 10)
    private String accountRadical;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "total_debit", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalDebit;

    @Column(name = "total_credit", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalCredit;

    @Column(name = "difference", nullable = false, precision = 18, scale = 4)
    private BigDecimal difference;

    @Column(name = "allow_partial", nullable = false)
    private Boolean allowPartial;

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
