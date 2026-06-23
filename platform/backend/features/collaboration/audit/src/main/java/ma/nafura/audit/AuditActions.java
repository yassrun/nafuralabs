package ma.nafura.platform.collaboration.audit;

/**
 * Standard audit action catalog for use with {@link AuditService#log}.
 * CRUD actions {@code create}, {@code update}, {@code delete} are auto-captured for
 * entities annotated with {@link Auditable}; others are logged manually by domain services.
 */
public final class AuditActions {

    private AuditActions() {}

    /** Entity created (auto when @Auditable). */
    public static final String CREATE = "create";
    /** Entity updated (auto when @Auditable). */
    public static final String UPDATE = "update";
    /** Entity deleted (auto when @Auditable). */
    public static final String DELETE = "delete";
    /** Status field changed (manual). */
    public static final String STATUS_CHANGE = "status_change";
    /** Record published (manual). */
    public static final String PUBLISH = "publish";
    /** Workflow approval (manual). */
    public static final String APPROVE = "approve";
    /** Workflow rejection (manual). */
    public static final String REJECT = "reject";
    /** Ownership/assignee change (manual). */
    public static final String ASSIGN = "assign";
    /** Comment added (manual). */
    public static final String COMMENT = "comment";
    /** File attached (manual). */
    public static final String ATTACH = "attach";
}
