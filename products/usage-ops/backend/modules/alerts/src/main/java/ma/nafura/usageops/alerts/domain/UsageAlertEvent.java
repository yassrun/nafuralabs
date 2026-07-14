package ma.nafura.usageops.alerts.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "usage_alert_event")
@Getter
@Setter
public class UsageAlertEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "alert_key", nullable = false, length = 255)
    private String alertKey;

    @Column(name = "tenant_id", length = 100)
    private String tenantId;

    @Column(name = "metric_key", nullable = false, length = 80)
    private String metricKey;

    @Column(name = "product_id", length = 80)
    private String productId;

    @Column(name = "used_value", nullable = false, precision = 24, scale = 6)
    private BigDecimal usedValue;

    @Column(name = "limit_value", nullable = false, precision = 24, scale = 6)
    private BigDecimal limitValue;

    @Column(name = "severity", nullable = false, length = 20)
    private String severity;

    @Column(name = "window_key", nullable = false, length = 40)
    private String windowKey;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
