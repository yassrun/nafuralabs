package ma.nafura.platform.integrations.googleplaces;

import java.util.List;

public record NearbySearchRequest(
        double latitude,
        double longitude,
        int radiusMeters,
        Integer maxResultCount,
        List<String> includedTypes
) {
    public NearbySearchRequest(double latitude, double longitude, int radiusMeters, Integer maxResultCount) {
        this(latitude, longitude, radiusMeters, maxResultCount, List.of("restaurant", "bar", "night_club"));
    }
}
