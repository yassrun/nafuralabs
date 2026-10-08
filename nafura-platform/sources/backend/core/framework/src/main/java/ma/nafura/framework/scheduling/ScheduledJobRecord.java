package ma.nafura.platform.framework.scheduling;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.nafura.platform.framework.domain.TenantEntity;

/**
 * Projection of a {@link ScheduledJob} from the code registry, plus last execution fields.
 * Rows are platform-wide ({@code tenantId} null) and synced at boot.
 */
@Entity
@Table(name = "scheduled_jobs")
@AttributeOverride(name = "tenantId", column = @Column(name = "tenant_id", nullable = true))
@Getter
@Setter
@NoArgsConstructor
public class ScheduledJobRecord extends TenantEntity {

    @Column(name = "job_key", nullable = false, length = 100, unique = true)
    private String jobKey;

    @Column(name = "description", nullable = false, length = 500)
    private String description;

    @Column(name = "cron", nullable = false, length = 120)
    private String cron;

    @Column(name = "tenant_scoped", nullable = false)
    private boolean tenantScoped;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    /** i18n key shown as the job name in the listing ({@code administration.scheduledJobs.jobs.<key>}). */
    @Column(name = "name_key", nullable = false, length = 200)
    private String nameKey;

    @Column(name = "last_status", length = 20)
    private String lastStatus;

    @Column(name = "last_started_at")
    private OffsetDateTime lastStartedAt;

    @Column(name = "last_duration_ms")
    private Long lastDurationMs;
}
