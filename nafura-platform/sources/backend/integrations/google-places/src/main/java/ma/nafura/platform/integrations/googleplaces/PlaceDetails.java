package ma.nafura.platform.integrations.googleplaces;

import java.util.List;

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
