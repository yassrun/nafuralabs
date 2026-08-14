package ma.nafura.platform.appsettings.api.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateGeneralRequest(
    @NotBlank String tenantName,
    @NotBlank String timezone,
    String contactEmail,
    String supportEmail
) {}

