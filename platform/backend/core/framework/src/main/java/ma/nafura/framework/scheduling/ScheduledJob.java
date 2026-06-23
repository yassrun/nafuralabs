package ma.nafura.platform.framework.scheduling;

/**
 * Contract for scheduled background jobs.
 */
public interface ScheduledJob {

    /**
     * Unique job key (e.g. "email-digest", "audit-archive").
     */
    String key();

    /**
     * Default cron expression (Spring format).
     */
    String cron();

    /**
     * Human-readable description.
     */
    String description();

    /**
     * Whether this job runs per-tenant or once globally.
     */
    boolean tenantScoped();

    /**
     * Execute the job for the given context.
     */
    void execute(ScheduledJobContext context);
}

