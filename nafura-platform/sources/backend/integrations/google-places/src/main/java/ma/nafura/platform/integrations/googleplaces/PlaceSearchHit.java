package ma.nafura.platform.integrations.googleplaces;

import java.util.List;

public record PlaceSearchHit(
        String id,
        LocalizedText displayName,
        String formattedAddress,
        GeoPoint location,
        List<String> types,
        String primaryType,
        String businessStatus
) {}
