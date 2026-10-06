package ma.nafura.platform.collaboration.audit;

/**
 * Standard audit action catalog for use with {@link AuditService#log}.
 * CRUD actions {@code create}, {@code update}, {@code delete} are auto-captured for
 * entities annotated with {@link ma.nafura.platform.framework.audit.Auditable};
 * others are logged manually by domain services.
 */
public final class AuditActions {

    private AuditActions() {}

    /** Entity created (auto when @Auditable). */
    public static final String CREATE = "create";
    /** Entity updated (auto when @Auditable). */
    public static final String UPDATE = "update";
    /** Entity deleted (auto when @Auditable). */
    public static final String DELETE = "delete";
    /** Status field changed (auto when @Auditable and only {@code status} differs among tracked fields). */
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
    /** Entity emailed (manual). */
    public static final String EMAIL = "emailed";
    /** Document printed / PDF rendered (manual). */
    public static final String PRINT = "print";
    /** Listing or document exported (manual). */
    public static final String EXPORT = "export";
    /** Workflow submitted for approval (manual). */
    public static final String SUBMIT = "submit";
    /** Tenant member invited (manual). */
    public static final String MEMBER_INVITE = "member_invite";
    /** Tenant invitation accepted (manual). */
    public static final String MEMBER_ACCEPT = "member_accept";
    /** Tenant invitation resent (manual). */
    public static final String MEMBER_RESEND = "member_resend";
    /** Tenant member roles changed (manual). */
    public static final String MEMBER_ROLES = "member_roles";
    /** Tenant member removed (manual). */
    public static final String MEMBER_REMOVE = "member_remove";
}
