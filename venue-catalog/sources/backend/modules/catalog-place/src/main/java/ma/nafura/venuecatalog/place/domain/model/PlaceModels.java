package ma.nafura.venuecatalog.place.domain.model;

import java.util.List;
import java.util.UUID;

public final class PlaceModels {

    private PlaceModels() {}

    public record Address(
            String line1,
            String district,
            String postalCode,
            String cityLabel,
            String countryCode
    ) {}

    public record Geo(double lat, double lng) {}

    public record Contact(String phoneE164, String websiteUrl, String mapUrl) {}

    public record TimeRange(String from, String to) {}

    public record OpeningHoursDay(String weekday, List<TimeRange> ranges) {}

    public record ProviderRating(Double average, Integer count, Integer priceLevel, String businessStatus) {}

    public record PlaceAttributes(
            Boolean servesAlcohol,
            Boolean reservable,
            Boolean wheelchairAccessible,
            Boolean takeout
    ) {}

    public record PlaceQuality(
            double completenessScore,
            double freshnessScore,
            double confidenceScore,
            boolean manualReviewRequired,
            List<UUID> duplicateCandidateIds
    ) {}
}
