package ma.nafura.platform.administration.iam.api.response.tenant;

import java.util.List;

/**
 * Tenant member response DTO.
 * Represents a member's details within a tenant.
 */
public record TenantMemberResponse(
    /** User ID */
    String userId,
    
    /** Email address */
    String email,
    
    /** Display name */
    String displayName,
    
    /** Avatar URL (optional) */
    String avatarUrl,
    
    /** Roles assigned to this member */
    List<String> roles,
    
    /** Membership status (active, invited, suspended) */
    String status,
    
    /** When the user joined the tenant */
    String joinedAt,
    
    /** Last activity timestamp */
    String lastActivityAt
) {}

