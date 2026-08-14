package ma.nafura.platform.administration.iam.api.response.tenant;

/**
 * Tenant usage statistics response DTO.
 */
public record TenantStatsResponse(
    /** Total number of members */
    int memberCount,
    
    /** Active members (logged in last 30 days) */
    int activeMemberCount,
    
    /** Pending invitations */
    int pendingInvitationCount,
    
    /** Storage usage in bytes */
    Long storageUsed,
    
    /** Storage limit in bytes */
    Long storageLimit,
    
    /** API calls this month */
    Long apiCallsThisMonth,
    
    /** API call limit */
    Long apiCallLimit
) {}

