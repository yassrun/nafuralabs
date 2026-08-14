package ma.nafura.platform.usersettings.api.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(
    @NotBlank String firstName,
    @NotBlank String lastName,
    String displayName,
    String phone
) {}

