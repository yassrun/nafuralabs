package ma.nafura.platform.authorization.api.response.tenant;

import java.util.List;

/**
 * Permission group response DTO.
 * Groups permissions by module for UI display.
 */
public record PermissionGroupResponse(
    /** Module name */
    String name,
    
    /** Module ID */
    String moduleId,
    
    /** Permissions in this group */
    List<PermissionDefinition> permissions
) {
    /**
     * Permission definition for display.
     */
    public record PermissionDefinition(
        String code,
        String name,
        String description,
        String module,
        String category
    ) {}
}

