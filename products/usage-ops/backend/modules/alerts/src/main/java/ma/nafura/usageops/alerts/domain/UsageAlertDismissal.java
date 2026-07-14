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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "usage_alert_dismissal")
@Getter
@Setter
public class UsageAlertDismissal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "alert_key", nullable = false, length = 255)
    private String alertKey;

    @Column(name = "user_id", nullable = false, length = 120)
    private String userId;

    @Column(name = "dismissed_at", nullable = false)
    private Instant dismissedAt;

    @PrePersist
    void onCreate() {
        if (dismissedAt == null) {
            dismissedAt = Instant.now();
        }
    }
}
