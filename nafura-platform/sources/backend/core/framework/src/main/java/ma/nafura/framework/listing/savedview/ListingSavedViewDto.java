package ma.nafura.platform.framework.listing.savedview;

import java.util.UUID;

/** DTO returned by listing saved views API. */
public record ListingSavedViewDto(
        UUID id,
        String resourceKey,
        String name,
        boolean isDefault,
        String queryJson) {}
