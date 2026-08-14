package ma.nafura.platform.administration.iam.api.request.tenant;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/**
 * Request to update a member's roles.
 */
public record UpdateMemberRolesRequest(
    @NotEmpty(message = "At least one role is required")
    List<String> roles
) {}

