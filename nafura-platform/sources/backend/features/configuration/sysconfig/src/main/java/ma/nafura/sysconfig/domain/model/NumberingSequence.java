package ma.nafura.platform.configuration.sysconfig.domain.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "numbering_sequences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NumberingSequence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "prefix", length = 50)
    private String prefix;

    @Column(name = "current_number", nullable = false)
    private Long currentNumber;

    @Column(name = "increment_by", nullable = false)
    private Integer incrementBy;

    @Column(name = "pad_length", nullable = false)
    private Integer padLength;

    @Column(name = "separator", length = 5)
    private String separator;

    @Column(name = "reset_policy", length = 20)
    private String resetPolicy; // NEVER, YEARLY, MONTHLY

    @Column(name = "year_format", length = 10)
    private String yearFormat; // YYYY, YY, or null

    @Column(name = "last_reset_at")
    private OffsetDateTime lastResetAt;

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

