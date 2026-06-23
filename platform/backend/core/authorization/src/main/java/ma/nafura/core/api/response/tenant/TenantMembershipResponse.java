package ma.nafura.platform.authorization.api.response.tenant;

import java.util.List;

/**
 * Tenant membership response DTO.
 * Contains all information about a user's membership in a tenant.
 */
public record TenantMembershipResponse(
    String tenantId,
    String tenantKey,
    String tenantName,
    List<String> enabledDomains,
    List<AuthRoleResponse> roles,
    // permissions removed - computed from roles[].permissions on frontend
    boolean isDefault,
    String createdAt,
    String updatedAt,
    String joinedAt
) {}


