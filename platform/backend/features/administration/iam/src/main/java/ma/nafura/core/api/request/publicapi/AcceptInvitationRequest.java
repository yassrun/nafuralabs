package ma.nafura.platform.administration.iam.api.request.publicapi;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AcceptInvitationRequest(
    @NotBlank String token,
    @Size(min = 8, max = 128) String password,
    @Size(max = 80) String firstName,
    @Size(max = 80) String lastName
) {}
