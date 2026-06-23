package ma.nafura.venuecatalog.source.adapter;

public final class PlaceSearchQueries {

    private PlaceSearchQueries() {}

    public record TextSearchQuery(String q, String countryCode, String cityCode, String primaryCategoryHint, Integer maxResults) {}

    public record NearbySearchQuery(double lat, double lng, int radiusMeters, Integer maxResults) {}
}
