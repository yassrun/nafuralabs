package ma.nafura.platform.administration.usage.api.response;

import java.util.UUID;

public record UsageTenantInfoResponse(
        UUID id,
        String key,
        String name,
        String applicationId
) {
}
