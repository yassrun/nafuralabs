package ma.nafura.platform.administration.access.api;

import jakarta.validation.constraints.NotNull;

/**
 * Request to update domain enablement.
 */
public record UpdateDomainRequest(
    @NotNull(message = "Enabled flag is required")
    Boolean enabled
) {}

