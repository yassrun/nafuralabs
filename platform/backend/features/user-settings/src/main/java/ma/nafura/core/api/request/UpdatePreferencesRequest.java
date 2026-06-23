package ma.nafura.platform.usersettings.api.request;

import jakarta.validation.constraints.NotBlank;

public record UpdatePreferencesRequest(
    @NotBlank String locale,
    @NotBlank String timezone,
    @NotBlank String theme,
    String dateFormat
) {}

