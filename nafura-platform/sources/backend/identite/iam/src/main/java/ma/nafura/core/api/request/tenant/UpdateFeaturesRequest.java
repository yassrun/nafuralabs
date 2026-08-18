package ma.nafura.platform.administration.iam.api.request.tenant;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

/**
 * Request to update feature flags.
 */
public record UpdateFeaturesRequest(
    @NotNull(message = "Features map is required")
    Map<String, Object> features
) {}

