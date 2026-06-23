package ma.nafura.platform.collaboration.notification.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "erp_alert_dismissals")
@IdClass(ErpAlertDismissal.ErpAlertDismissalId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErpAlertDismissal {

    @Id
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Id
    @Column(name = "alert_key", nullable = false, length = 200)
    private String alertKey;

    @Column(name = "dismissed_at", nullable = false)
    private OffsetDateTime dismissedAt;

    @PrePersist
    protected void onCreate() {
        if (dismissedAt == null) {
            dismissedAt = OffsetDateTime.now();
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ErpAlertDismissalId implements Serializable {
        private UUID tenantId;
        private UUID userId;
        private String alertKey;
    }
}
