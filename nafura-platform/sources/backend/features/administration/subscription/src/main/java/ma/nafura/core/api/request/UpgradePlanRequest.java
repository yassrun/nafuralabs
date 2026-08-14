package ma.nafura.platform.subscription.api.request;

import jakarta.validation.constraints.NotBlank;

public record UpgradePlanRequest(
    @NotBlank String planId
) {}

