package ma.nafura.platform.integrations.googleplaces;

import java.util.List;

public record GeoPoint(double lat, double lng) {}

public record LocalizedText(String text, String languageCode) {}

public record PlacePhotoRef(String name, int widthPx, int heightPx, List<String> authorAttributions) {}

public record PlaceSearchHit(
        String id,
        LocalizedText displayName,
        String formattedAddress,
        GeoPoint location,
        List<String> types,
        String primaryType,
        String businessStatus
) {}

public record PlaceSearchResult(List<PlaceSearchHit> places, String nextPageToken) {}

public record AddressComponent(String longText, String shortText, List<String> types) {}

public record OpeningHoursPeriod(String openDay, String openTime, String closeDay, String closeTime) {}

public record RegularOpeningHours(List<OpeningHoursPeriod> periods, List<String> weekdayDescriptions) {}

public record PlaceDetails(
        String id,
        LocalizedText displayName,
        String formattedAddress,
        List<AddressComponent> addressComponents,
        GeoPoint location,
        List<String> types,
        String primaryType,
        String businessStatus,
        String nationalPhoneNumber,
        String websiteUri,
        String googleMapsUri,
        RegularOpeningHours regularOpeningHours,
        Double rating,
        Integer userRatingCount,
        String priceLevel,
        List<PlacePhotoRef> photos,
        Boolean reservable,
        Boolean servesBeer,
        Boolean servesWine,
        Boolean outdoorSeating,
        Boolean liveMusic,
        AccessibilityOptions accessibilityOptions
) {
    public record AccessibilityOptions(Boolean wheelchairAccessibleEntrance) {}
}

public record TextSearchRequest(String textQuery, String regionCode, Double latitude, Double longitude, Integer maxResultCount) {}

public record NearbySearchRequest(double latitude, double longitude, int radiusMeters, Integer maxResultCount) {}
