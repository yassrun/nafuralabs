package ma.nafura.platform.administration.iam.api.request.tenant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request to create a custom role for a tenant.
 */
public record CreateRoleRequest(
    @NotBlank(message = "Role code is required")
    @Size(max = 50)
    String roleCode,

    @NotBlank(message = "Role name is required")
    @Size(max = 120)
    String name,

    @Size(max = 500)
    String description,

    List<@NotBlank(message = "Permission cannot be blank") @Size(max = 255) String> permissions
) {}

