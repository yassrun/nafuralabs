package ma.nafura.platform.administration.iam.api.request.tenant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request to update a member's status.
 */
public record UpdateMemberStatusRequest(
    @NotBlank(message = "Status is required")
    @Pattern(regexp = "active|suspended", message = "Status must be 'active' or 'suspended'")
    String status
) {}

