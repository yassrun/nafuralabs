package ma.nafura.platform.administration.iam.api.request.tenant;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

/**
 * Request to assign or remove a role for multiple members at once.
 */
public record BulkMemberRoleRequest(
    @NotEmpty(message = "At least one member is required")
    List<UUID> memberIds
) {}

