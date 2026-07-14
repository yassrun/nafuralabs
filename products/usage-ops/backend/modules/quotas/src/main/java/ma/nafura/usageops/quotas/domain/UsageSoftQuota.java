package ma.nafura.usageops.quotas.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "usage_soft_quota")
@Getter
@Setter
public class UsageSoftQuota {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id")
    private String tenantId;

    @Column(name = "metric_key", nullable = false, length = 80)
    private String metricKey;

    @Column(name = "soft_limit", nullable = false, precision = 24, scale = 6)
    private BigDecimal softLimit;

    @Column(name = "warn_percent", nullable = false)
    private Integer warnPercent = 80;

    @Column(name = "product_id", length = 80)
    private String productId;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (warnPercent == null) {
            warnPercent = 80;
        }
        if (enabled == null) {
            enabled = true;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
