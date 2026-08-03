package ma.nafura.venuecatalog.source.adapter;

import java.util.List;

public final class PlaceSearchQueries {

    private PlaceSearchQueries() {}

    public record TextSearchQuery(String q, String countryCode, String cityCode, String primaryCategoryHint, Integer maxResults) {}

    public record NearbySearchQuery(
            double lat,
            double lng,
            int radiusMeters,
            Integer maxResults,
            List<String> includedTypes
    ) {
        public NearbySearchQuery(double lat, double lng, int radiusMeters, Integer maxResults) {
            this(lat, lng, radiusMeters, maxResults, null);
        }
    }
}
