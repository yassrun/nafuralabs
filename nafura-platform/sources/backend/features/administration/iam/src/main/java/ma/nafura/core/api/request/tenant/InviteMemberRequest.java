package ma.nafura.platform.administration.iam.api.request.tenant;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/**
 * Request to invite a new member to a tenant.
 */
public record InviteMemberRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,
    
    @NotEmpty(message = "At least one role is required")
    List<String> roles,
    
    /** Optional personal message */
    String message
) {}

