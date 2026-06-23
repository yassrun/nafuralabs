package ma.nafura.platform.administration.iam.api.request.tenant;

import jakarta.validation.constraints.NotNull;

/**
 * Request to update domain enablement.
 */
public record UpdateDomainRequest(
    @NotNull(message = "Enabled flag is required")
    Boolean enabled
) {}

