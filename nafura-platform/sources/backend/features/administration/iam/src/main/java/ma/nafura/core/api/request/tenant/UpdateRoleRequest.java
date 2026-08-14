package ma.nafura.platform.administration.iam.api.request.tenant;

import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request to update a custom role (PATCH: only provided fields are updated).
 */
public record UpdateRoleRequest(
    @Size(max = 120)
    String name,

    @Size(max = 500)
    String description,

    List<@Size(max = 255) String> permissions
) {}

